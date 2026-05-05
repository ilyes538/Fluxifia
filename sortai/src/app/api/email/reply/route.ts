export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const orgId = session.user.orgId;
  if (!orgId) return NextResponse.json({ error: "Organisation non trouvée" }, { status: 400 });

  const { emailLogId, replyText } = await req.json();
  if (!emailLogId || !replyText) {
    return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
  }

  const emailLog = await prisma.emailLog.findFirst({ where: { id: emailLogId, orgId } });
  if (!emailLog) return NextResponse.json({ error: "Email introuvable" }, { status: 404 });

  const integration = await prisma.integration.findUnique({
    where: { orgId_type: { orgId, type: "gmail" } },
  });
  if (!integration?.accessToken) {
    return NextResponse.json({ error: "Gmail non connecté" }, { status: 400 });
  }

  // Build RFC 2822 message
  const replyTo = emailLog.from ?? "";
  const subject = emailLog.subject?.startsWith("Re:") ? emailLog.subject : `Re: ${emailLog.subject}`;

  const rawMessage = [
    `To: ${replyTo}`,
    `Subject: ${subject}`,
    `Content-Type: text/plain; charset=utf-8`,
    `In-Reply-To: ${emailLog.gmailId}`,
    `References: ${emailLog.gmailId}`,
    "",
    replyText,
  ].join("\r\n");

  const encodedMessage = Buffer.from(rawMessage)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const sendRes = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/send`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${integration.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        raw: encodedMessage,
        threadId: emailLog.threadId,
      }),
    }
  );

  if (!sendRes.ok) {
    const err = await sendRes.json();
    return NextResponse.json({ error: "Erreur envoi Gmail", details: err }, { status: 502 });
  }

  await prisma.emailLog.update({
    where: { id: emailLogId },
    data: { replied: true, action: "replied" },
  });

  return NextResponse.json({ success: true });
}
