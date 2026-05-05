import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { EmailInbox } from "@/components/dashboard/EmailInbox";

export const metadata = { title: "Emails" };

export default async function EmailsPage() {
  const session = await getServerSession(authOptions);
  const orgId = session!.user.orgId;

  const [emails, gmailConnected, agentEnabled] = await Promise.all([
    orgId
      ? prisma.emailLog.findMany({
          where: { orgId },
          orderBy: { createdAt: "desc" },
          take: 50,
        })
      : [],
    orgId
      ? prisma.integration.findUnique({ where: { orgId_type: { orgId, type: "gmail" } } })
      : null,
    orgId
      ? prisma.agent.findFirst({ where: { orgId, type: "email", enabled: true } })
      : null,
  ]);

  return (
    <EmailInbox
      initialEmails={emails}
      gmailConnected={!!gmailConnected?.connected}
      agentEnabled={!!agentEnabled}
    />
  );
}
