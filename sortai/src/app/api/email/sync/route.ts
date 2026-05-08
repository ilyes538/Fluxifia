export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getValidAccessToken } from "@/lib/oauth";

interface GmailMessage {
  id: string;
  threadId: string;
}

interface EmailPreview {
  gmailId: string;
  from: string;
  subject: string;
  date: string;
}

interface FetchedEmail {
  gmailId: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  date: string;
  body: string;
  bodyHtml: string;
}

// Fetch emails from Gmail — returns preview + full data without storing in DB
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const orgId = session.user.orgId;
    if (!orgId) return NextResponse.json({ error: "Organisation non trouvée" }, { status: 400 });

    const integration = await prisma.integration.findUnique({
      where: { orgId_type: { orgId, type: "gmail" } },
    });
    if (!integration?.connected || !integration.accessToken) {
      return NextResponse.json({ error: "Gmail non connecté" }, { status: 400 });
    }

    const accessToken = await getValidAccessToken(integration.id);

    const agent = await prisma.agent.findFirst({ where: { orgId, type: "email", enabled: true } });
    if (!agent) return NextResponse.json({ error: "Agent Email non activé" }, { status: 403 });

    // 1. Identify the Gmail account email
    let currentGmailEmail: string | null = null;
    try {
      const profileRes = await fetch(
        "https://gmail.googleapis.com/gmail/v1/users/me/profile",
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (profileRes.ok) {
        const profile = (await profileRes.json()) as { emailAddress?: string };
        currentGmailEmail = profile.emailAddress ?? null;
      }
    } catch (e) {
      console.error("Failed to fetch Gmail profile:", e);
    }

    // Parse existing metadata
    let meta: Record<string, unknown> = {};
    try {
      meta = JSON.parse(integration.metadata || "{}") as Record<string, unknown>;
    } catch { /* ignore */ }

    // 2. Determine sync window
    let query = "newer_than:1d";

    if (!currentGmailEmail) {
      // Can't verify account → safe fallback to 24h
      query = "newer_than:1d in:inbox";
    } else if (!integration.gmailEmail || integration.gmailEmail !== currentGmailEmail) {
      // Different account (or first time we track it) → start from 24h
      query = "newer_than:1d in:inbox";
    } else {
      // Same account → use last fetch time if available
      const lastFetchAt = meta.lastFetchAt ? new Date(meta.lastFetchAt as string) : null;
      if (lastFetchAt && !isNaN(lastFetchAt.getTime())) {
        const after = Math.floor(lastFetchAt.getTime() / 1000);
        query = `after:${after} in:inbox`;
      }
    }

    // 3. Fetch emails from Gmail
    const listRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=50&q=${encodeURIComponent(query)}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!listRes.ok) {
      const errText = await listRes.text().catch(() => "unknown");
      console.error("Gmail API list error:", listRes.status, errText);
      return NextResponse.json({ error: "Erreur Gmail API", details: errText }, { status: 502 });
    }

    const listData = await listRes.json();
    const messages: GmailMessage[] = listData.messages ?? [];

    const preview: EmailPreview[] = [];
    const fullMessages: FetchedEmail[] = [];

    for (const msg of messages) {
      try {
        const msgRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (!msgRes.ok) continue;
        const msgData = await msgRes.json();

        const headers: { name: string; value: string }[] = msgData.payload?.headers ?? [];
        const subject = headers.find((h) => h.name === "Subject")?.value ?? "(Sans sujet)";
        const from = headers.find((h) => h.name === "From")?.value ?? "";
        const to = headers.find((h) => h.name === "To")?.value ?? "";
        const date = headers.find((h) => h.name === "Date")?.value ?? "";

        // Extract body text & HTML
        let body = "";
        let bodyHtml = "";
        const extractText = (part: { mimeType?: string; body?: { data?: string }; parts?: unknown[] }): string => {
          if (part.mimeType === "text/plain" && part.body?.data) {
            return Buffer.from(part.body.data, "base64").toString("utf-8");
          }
          if (part.parts && Array.isArray(part.parts)) {
            return part.parts.map((p) => extractText(p as typeof part)).filter(Boolean).join("\n");
          }
          return "";
        };
        const extractHtml = (part: { mimeType?: string; body?: { data?: string }; parts?: unknown[] }): string => {
          if (part.mimeType === "text/html" && part.body?.data) {
            return Buffer.from(part.body.data, "base64").toString("utf-8");
          }
          if (part.parts && Array.isArray(part.parts)) {
            for (const p of part.parts as typeof part[]) {
              const html = extractHtml(p);
              if (html) return html;
            }
          }
          return "";
        };
        body = extractText(msgData.payload).slice(0, 10000);
        bodyHtml = extractHtml(msgData.payload).slice(0, 100000);
        if (!body && msgData.snippet) body = msgData.snippet;

        preview.push({ gmailId: msg.id, from, subject, date });
        fullMessages.push({ gmailId: msg.id, threadId: msgData.threadId, from, to, subject, date, body, bodyHtml });
      } catch (msgErr) {
        console.error("Failed to process message", msg.id, msgErr);
        continue;
      }
    }

    // 5. Update integration: lastFetchAt + gmailEmail
    try {
      meta.lastFetchAt = new Date().toISOString();
      await prisma.integration.update({
        where: { id: integration.id },
        data: {
          metadata: JSON.stringify(meta),
          gmailEmail: currentGmailEmail ?? integration.gmailEmail,
        },
      });
    } catch (e) {
      console.error("Failed to update integration after sync:", e);
    }

    return NextResponse.json({
      count: preview.length,
      preview,
      messages: fullMessages,
    });
  } catch (err) {
    console.error("Sync error:", err);
    const message = err instanceof Error ? err.message : "Erreur interne";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
