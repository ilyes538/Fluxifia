export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getValidAccessToken } from "@/lib/oauth";
import { hashMessageId } from "@/lib/encryption";

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
export async function POST(_req: NextRequest) {
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

    // 2. Determine sync window
    let query = "newer_than:1d in:inbox";

    if (currentGmailEmail && integration.gmailEmail === currentGmailEmail) {
      // Same account → use last report date, capped at 7 days
      const lastReport = await prisma.report.findFirst({
        where: { orgId, gmailEmail: currentGmailEmail },
        orderBy: { createdAt: "desc" },
      });

      const fallback24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const maxLookback = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const syncSince = lastReport?.createdAt
        ? (lastReport.createdAt > maxLookback ? lastReport.createdAt : maxLookback)
        : fallback24h;

      const after = Math.floor(syncSince.getTime() / 1000);
      query = `after:${after} in:inbox`;
    }

    // 3. Fetch emails from Gmail
    const listRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=500&q=${encodeURIComponent(query)}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!listRes.ok) {
      const errText = await listRes.text().catch(() => "unknown");
      console.error("Gmail API list error:", listRes.status, errText);
      let message = "Erreur Gmail API";
      if (listRes.status === 401) message = "Session Gmail expirée. Reconnectez votre compte.";
      else if (listRes.status === 403) message = "Accès Gmail refusé. Vérifiez les permissions.";
      else if (listRes.status === 429) message = "Trop de requêtes Gmail. Réessayez dans quelques minutes.";
      else if (listRes.status >= 500) message = "Gmail est temporairement indisponible. Réessayez plus tard.";
      return NextResponse.json({ error: message, details: errText }, { status: 502 });
    }

    const listData = await listRes.json();
    const messages: GmailMessage[] = listData.messages ?? [];

    // 4. Load already-processed message hashes for this account
    const processedHashes = new Set<string>();
    if (currentGmailEmail) {
      const previousReports = await prisma.report.findMany({
        where: { orgId, gmailEmail: currentGmailEmail },
        select: { processedMessageHashes: true },
      });
      for (const report of previousReports) {
        const hashes = JSON.parse(report.processedMessageHashes) as string[];
        for (const h of hashes) {
          processedHashes.add(h);
        }
      }
    }

    const preview: EmailPreview[] = [];
    const fullMessages: FetchedEmail[] = [];

    for (const msg of messages) {
      // Skip already-processed emails (hash match)
      if (processedHashes.has(hashMessageId(msg.id))) continue;

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

    // 5. Update integration gmailEmail if needed (no lastFetchAt update here)
    try {
      if (currentGmailEmail && integration.gmailEmail !== currentGmailEmail) {
        await prisma.integration.update({
          where: { id: integration.id },
          data: { gmailEmail: currentGmailEmail },
        });
      }
    } catch (e) {
      console.error("Failed to update integration gmailEmail:", e);
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
