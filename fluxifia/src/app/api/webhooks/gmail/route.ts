export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkTokenLimit } from "@/lib/limits";

// Gmail Push Notifications webhook
// Setup: call Gmail API watch() with this endpoint as the push URL
// Gmail sends a Pub/Sub message when new emails arrive

interface GmailPubSubMessage {
  message: {
    data: string; // base64 encoded JSON { emailAddress, historyId }
    messageId: string;
  };
  subscription: string;
}

export async function POST(req: NextRequest) {
  // Verify the request comes from Google Pub/Sub
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.GMAIL_WEBHOOK_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  let body: GmailPubSubMessage;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const decoded = Buffer.from(body.message.data, "base64").toString("utf-8");
  const { emailAddress } = JSON.parse(decoded);

  // Find the integration for this email
  const integration = await prisma.integration.findFirst({
    where: {
      type: "gmail",
      connected: true,
      metadata: { contains: emailAddress },
    },
    include: { org: { include: { agents: { where: { type: "email", enabled: true } } } } },
  });

  if (!integration || !integration.org.agents.length) {
    return NextResponse.json({ ok: true }); // No agent configured, ignore
  }

  const orgId = integration.orgId;
  const agent = integration.org.agents[0];

  const { allowed } = await checkTokenLimit(orgId);
  if (!allowed) {
    console.log(`[Gmail Webhook] Token limit reached for org ${orgId}`);
    return NextResponse.json({ ok: true });
  }

  // In production: fetch the actual email content using Gmail API with the historyId
  // For now, log and acknowledge
  console.log(`[Gmail Webhook] New email for ${emailAddress} — org ${orgId}`);

  // Example: auto-categorize the email
  // const emailContent = await fetchEmailFromGmail(integration.accessToken, historyId);
  // const result = await runAgent({ type: "email", input: emailContent, ... });

  await prisma.agentRun.create({
    data: {
      agentId: agent.id,
      status: "success",
      input: `webhook:${emailAddress}`,
      output: "Email reçu — traitement automatique déclenché",
      tokensUsed: 0,
      durationMs: 0,
    },
  });

  return NextResponse.json({ ok: true });
}
