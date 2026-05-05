export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { runAgent } from "@/lib/anthropic";

// Fetch emails from Gmail and process them with GPT
export async function POST(req: NextRequest) {
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

  const agent = await prisma.agent.findFirst({ where: { orgId, type: "email", enabled: true } });
  if (!agent) return NextResponse.json({ error: "Agent Email non activé" }, { status: 403 });

  // Fetch last 10 unread emails from Gmail
  const listRes = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10&q=is:unread",
    { headers: { Authorization: `Bearer ${integration.accessToken}` } }
  );

  if (!listRes.ok) {
    return NextResponse.json({ error: "Erreur Gmail API" }, { status: 502 });
  }

  const listData = await listRes.json();
  const messages: { id: string }[] = listData.messages ?? [];

  let processed = 0;

  for (const msg of messages) {
    // Skip already processed
    const existing = await prisma.emailLog.findUnique({
      where: { orgId_gmailId: { orgId, gmailId: msg.id } },
    });
    if (existing) continue;

    // Fetch full message
    const msgRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
      { headers: { Authorization: `Bearer ${integration.accessToken}` } }
    );
    if (!msgRes.ok) continue;
    const msgData = await msgRes.json();

    const headers: { name: string; value: string }[] = msgData.payload?.headers ?? [];
    const subject = headers.find((h) => h.name === "Subject")?.value ?? "(Sans sujet)";
    const from = headers.find((h) => h.name === "From")?.value ?? "";
    const to = headers.find((h) => h.name === "To")?.value ?? "";

    // Extract body text
    let body = "";
    const extractText = (part: { mimeType: string; body?: { data?: string }; parts?: unknown[] }): string => {
      if (part.mimeType === "text/plain" && part.body?.data) {
        return Buffer.from(part.body.data, "base64").toString("utf-8");
      }
      if (part.parts) {
        return (part.parts as typeof part[]).map(extractText).join("");
      }
      return "";
    };
    body = extractText(msgData.payload).slice(0, 3000);
    if (!body && msgData.snippet) body = msgData.snippet;

    // Process with GPT
    const result = await runAgent({
      type: "email",
      systemPrompt: agent.systemPrompt ?? undefined,
      input: `Sujet : ${subject}\nDe : ${from}\n\n${body}`,
      context: {
        task: `Analyse cet email et retourne UNIQUEMENT un JSON valide avec ces champs :
{
  "category": "support|commercial|urgent|newsletter|internal|other",
  "priority": "high|medium|low",
  "summary": "résumé en 1-2 phrases",
  "suggestedReply": "réponse professionnelle complète en français"
}`,
      },
    });

    let category = "other";
    let priority = "medium";
    let summary = "";
    let aiReply = "";

    try {
      const json = JSON.parse(result.output.replace(/```json|```/g, "").trim());
      category = json.category ?? "other";
      priority = json.priority ?? "medium";
      summary = json.summary ?? "";
      aiReply = json.suggestedReply ?? "";
    } catch {
      summary = result.output.slice(0, 200);
    }

    await prisma.emailLog.create({
      data: {
        orgId,
        gmailId: msg.id,
        threadId: msgData.threadId,
        subject,
        from,
        to,
        body: body.slice(0, 2000),
        action: "categorized",
        category,
        priority,
        summary,
        aiReply,
        aiResponse: result.output.slice(0, 1000),
      },
    });

    processed++;
  }

  return NextResponse.json({ processed, total: messages.length });
}
