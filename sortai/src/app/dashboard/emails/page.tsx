import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { decryptWithPrefix } from "@/lib/encryption";
import { sleep } from "@/lib/sleep";
import { EmailDashboard } from "@/components/dashboard/EmailDashboard";
import type { MonthlyStats } from "@/lib/email-utils";

export const metadata = { title: "Agent Email" };

export default async function EmailsPage() {
  const session = await getServerSession(authOptions);
  const orgId = session!.user.orgId;

  // Artificial delay to show the loader animation
  await sleep(2500);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const sub = orgId ? await prisma.subscription.findUnique({ where: { orgId } }) : null;
  const periodStart = sub?.currentPeriodStart ?? startOfMonth;

  const [gmailConnected, agentEnabled, reports] = await Promise.all([
    orgId
      ? prisma.integration.findUnique({ where: { orgId_type: { orgId, type: "gmail" } } })
      : null,
    orgId
      ? prisma.agent.findFirst({ where: { orgId, type: "email", enabled: true } })
      : null,
    orgId
      ? prisma.report.findMany({
          where: {
            orgId,
            createdAt: { gte: periodStart },
          },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            period: true,
            totalEmails: true,
            summary: true,
            stats: true,
            createdAt: true,
            tokenCost: true,
            gmailEmail: true,
          },
        })
      : [],
  ]);

  // Agréger les stats
  let totalEmails = 0;
  const typeBreakdown = {
    prospectClient: 0,
    interne: 0,
    newsletterPromotion: 0,
    information: 0,
    needsReply: 0,
  };

  for (const report of reports) {
    totalEmails += report.totalEmails;
    try {
      const stats = JSON.parse(decryptWithPrefix(report.stats)) as {
        prospectClient?: number;
        interne?: number;
        newsletterPromotion?: number;
        information?: number;
        needsReply?: number;
      };
      typeBreakdown.prospectClient += stats.prospectClient ?? 0;
      typeBreakdown.interne += stats.interne ?? 0;
      typeBreakdown.newsletterPromotion += stats.newsletterPromotion ?? 0;
      typeBreakdown.information += stats.information ?? 0;
      typeBreakdown.needsReply += stats.needsReply ?? 0;
    } catch {
      // ignore
    }
  }

  // Accounts with reports
  const gmailAccounts = Array.from(new Set(reports.map((r) => r.gmailEmail).filter(Boolean))) as string[];

  const monthlyStats: MonthlyStats = {
    reportsCount: reports.length,
    totalEmails,
    typeBreakdown,
  };

  return (
    <div
      className="min-h-[calc(100vh-4rem)] -m-6 p-6 overflow-x-hidden"
      style={{
        background: "radial-gradient(ellipse 800px 700px at -5% -5%, rgba(124,58,237,0.28) 0%, transparent 65%), radial-gradient(ellipse 900px 700px at 105% 105%, rgba(99,102,241,0.18) 0%, transparent 60%), radial-gradient(ellipse 500px 400px at 50% 110%, rgba(139,92,246,0.10) 0%, transparent 60%), #08070f",
      }}
    >
      <EmailDashboard
        gmailConnected={!!gmailConnected?.connected}
        agentEnabled={!!agentEnabled}
        monthlyStats={monthlyStats}
        history={reports.map((r) => ({
          id: r.id,
          createdAt: r.createdAt.toISOString(),
          period: r.period,
          totalEmails: r.totalEmails,
          summary: decryptWithPrefix(r.summary),
          tokenCost: r.tokenCost,
          stats: decryptWithPrefix(r.stats),
          gmailEmail: r.gmailEmail,
        }))}
        gmailAccounts={gmailAccounts}
      />
    </div>
  );
}
