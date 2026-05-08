import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMonthlyCreditsUsed, getOrgPlan, PLAN_LIMITS } from "@/lib/limits";
import { prisma } from "@/lib/db";
import { Zap, Mail, Bot, TrendingUp } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Utilisation" };

export default async function UsagePage() {
  const session = await getServerSession(authOptions);
  const orgId = session!.user.orgId!;

  const plan = await getOrgPlan(orgId);
  const limits = PLAN_LIMITS[plan];
  const creditsUsed = await getMonthlyCreditsUsed(orgId);

  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);

  const [emailsProcessed, agentRuns, activeAgents, agentRunsByType] = await Promise.all([
    prisma.report.count({ where: { orgId, createdAt: { gte: start } } }),
    prisma.agentRun.count({ where: { agent: { orgId }, createdAt: { gte: start } } }),
    prisma.agent.count({ where: { orgId, enabled: true } }),
    prisma.agentRun.groupBy({
      by: ["agentId"],
      where: { agent: { orgId }, createdAt: { gte: start } },
      _count: { id: true },
      _sum: { creditsUsed: true },
    }),
  ]);

  const creditsLimit = limits.creditsPerMonth;
  const creditsPercent = creditsLimit === Infinity ? 0 : Math.min(100, Math.round((creditsUsed / creditsLimit) * 100));

  const agentDetails = await Promise.all(
    agentRunsByType.map(async (r) => {
      const agent = await prisma.agent.findUnique({ where: { id: r.agentId }, select: { name: true, type: true } });
      return { ...agent, runs: r._count.id, credits: r._sum.creditsUsed ?? 0 };
    })
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Utilisation ce mois</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Plan <span className="capitalize font-medium text-white">{plan}</span> — réinitialisation le 1er du mois
        </p>
      </div>

      {/* Usage bars */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Credits */}
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap size={16} style={{ color: "var(--accent-light)" }} />
              <span className="font-medium text-sm">Crédits utilisés</span>
            </div>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              {creditsUsed.toLocaleString("fr-FR")} / {creditsLimit === Infinity ? "∞" : creditsLimit.toLocaleString("fr-FR")}
            </span>
          </div>
          <div className="w-full h-2 rounded-full" style={{ background: "rgba(255,255,255,0.1)" }}>
            <div
              className="h-2 rounded-full transition-all"
              style={{
                width: `${creditsPercent}%`,
                background: creditsPercent > 80 ? "#ef4444" : creditsPercent > 60 ? "#f59e0b" : "var(--accent)",
              }}
            />
          </div>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>{creditsPercent}% utilisé</p>
        </div>

        {/* Emails */}
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail size={16} style={{ color: "var(--green)" }} />
              <span className="font-medium text-sm">Rapports générés</span>
            </div>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              {emailsProcessed}
            </span>
          </div>
          <div className="text-3xl font-bold">{emailsProcessed}</div>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>rapports ce mois</p>
        </div>

        {/* Agent runs */}
        <div className="card space-y-3">
          <div className="flex items-center gap-2">
            <Bot size={16} style={{ color: "#38bdf8" }} />
            <span className="font-medium text-sm">Exécutions d&apos;agents</span>
          </div>
          <div className="text-3xl font-bold">{agentRuns}</div>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>ce mois • {activeAgents} agent(s) actif(s)</p>
        </div>

        {/* Upgrade CTA if >60% */}
        {creditsPercent > 60 && plan !== "enterprise" && (
          <div className="card flex flex-col justify-between" style={{ borderColor: "rgba(124,58,237,0.4)" }}>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={16} style={{ color: "var(--accent-light)" }} />
              <span className="font-medium text-sm">Bientôt à la limite</span>
            </div>
            <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
              Passez au plan supérieur pour continuer sans interruption.
            </p>
            <Link href="/dashboard/billing" className="btn-primary text-sm text-center">
              Upgrader mon plan
            </Link>
          </div>
        )}
      </div>

      {/* Per-agent breakdown */}
      {agentDetails.length > 0 && (
        <div className="card">
          <h2 className="font-semibold mb-4">Détail par agent</h2>
          <div className="space-y-3">
            {agentDetails.map((a, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                <div>
                  <p className="text-sm font-medium">{a.name}</p>
                  <p className="text-xs capitalize" style={{ color: "var(--text-muted)" }}>{a.type}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm">{a.runs} exécutions</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>{a.credits.toLocaleString("fr-FR")} crédits</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
