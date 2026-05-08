import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getOrgPlan, PLAN_LIMITS, getMonthlyCreditsUsed } from "@/lib/limits";
import { CreditUsageChart } from "@/components/dashboard/CreditUsageChart";
import { parseAgentUsages, parseCreditTimeline } from "@/lib/dashboard";
import { DashboardAgentToggle } from "@/components/dashboard/DashboardAgentToggle";
import Link from "next/link";
import { Zap, TrendingUp, Sparkles, ArrowRight } from "lucide-react";

export const metadata = { title: "Vue d'ensemble" };

const AGENT_CATALOG = [
  { type: "email", name: "Agent Email", description: "Compte rendu et réponses email", requiredIntegrations: ["gmail", "outlook"], icon: "📧" },
  { type: "slack", name: "Agent Slack", description: "Réponses et résumés Slack", requiredIntegrations: ["slack"], icon: "💬" },
  { type: "notion", name: "Agent Notion", description: "Comptes rendus et pages Notion", requiredIntegrations: ["notion"], icon: "📝" },
  { type: "calendar", name: "Agent Agenda", description: "Planification et rappels", requiredIntegrations: ["gmail", "outlook"], icon: "📅" },
  { type: "lead", name: "Agent Lead", description: "Qualification des prospects", requiredIntegrations: ["gmail"], icon: "🎯" },
  { type: "support", name: "Agent Support", description: "Support client automatique", requiredIntegrations: ["gmail", "outlook"], icon: "🛟" },
];

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const orgId = session!.user.orgId;

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const sub = orgId ? await prisma.subscription.findUnique({ where: { orgId } }) : null;
  const periodStart = sub?.currentPeriodStart ?? startOfMonth;

  const [agents, integrations, creditsUsed, agentRuns] = await Promise.all([
    orgId ? prisma.agent.findMany({ where: { orgId } }) : [],
    orgId ? prisma.integration.findMany({ where: { orgId, connected: true } }) : [],
    orgId ? getMonthlyCreditsUsed(orgId) : 0,
    orgId
      ? prisma.agentRun.findMany({
          where: { agent: { orgId }, createdAt: { gte: periodStart }, status: "success" },
          select: { creditsUsed: true, createdAt: true, agent: { select: { type: true } } },
        })
      : [],
  ]);

  const plan = await getOrgPlan(orgId ?? "");
  const planConfig = PLAN_LIMITS[plan];
  const creditsLimit = planConfig.creditsPerMonth;
  const creditsPercent = creditsLimit === Infinity ? 0 : Math.min(100, Math.round((creditsUsed / creditsLimit) * 100));
  const creditsRemaining = creditsLimit === Infinity ? Infinity : Math.max(0, creditsLimit - creditsUsed);
  const isFree = plan === "free";
  const isOutOfCredits = creditsRemaining === 0;

  const connectedTypes = new Set(integrations.map((i) => i.type));
  const activeCount = agents.filter((a) => a.enabled).length;
  const maxAgents = planConfig.agents;

  const usages = parseAgentUsages(agentRuns);
  const { data: timelineData, agentTypes: timelineAgents } = parseCreditTimeline(agentRuns, periodStart);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Bonjour, {session!.user.name?.split(" ")[0] ?? "là"} 👋</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          Voici ce qui se passe dans votre espace Fluxifia
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Plan */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>Plan actuel</span>
            <TrendingUp size={14} style={{ color: "#fbbf24" }} />
          </div>
          <div className="text-xl font-bold uppercase">{plan}</div>
          {(isFree || isOutOfCredits) && (
            <Link href="/dashboard/billing" className="btn-primary text-xs w-full mt-3 flex items-center justify-center gap-1">
              {isOutOfCredits ? "Recharger mes crédits" : "Passer au plan Starter"} <ArrowRight size={12} />
            </Link>
          )}
        </div>

        {/* Credits */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>Crédits restants</span>
            <Zap size={14} style={{ color: "var(--accent-light)" }} />
          </div>
          <div className="text-xl font-bold">
            {creditsRemaining === Infinity ? "∞" : creditsRemaining.toLocaleString("fr-FR")}
            <span className="text-sm font-normal" style={{ color: "var(--text-muted)" }}>
              {" "}/ {creditsLimit === Infinity ? "∞" : creditsLimit.toLocaleString("fr-FR")}
            </span>
          </div>
          {creditsLimit !== Infinity && (
            <div className="w-full h-1.5 rounded-full mt-3" style={{ background: "rgba(255,255,255,0.1)" }}>
              <div
                className="h-1.5 rounded-full transition-all"
                style={{
                  width: `${creditsPercent}%`,
                  background: creditsPercent > 80 ? "#ef4444" : creditsPercent > 60 ? "#f59e0b" : "var(--accent)",
                }}
              />
            </div>
          )}
        </div>

        {/* Quick link */}
        <div className="card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>Compte rendu email</span>
            <Sparkles size={14} style={{ color: "var(--accent-light)" }} />
          </div>
          <p className="text-sm mb-3" style={{ color: "var(--text-muted)" }}>
            Récupérez vos emails et générez un résumé structuré par IA.
          </p>
          <Link href="/dashboard/emails" className="btn-primary text-xs w-full flex items-center justify-center gap-1">
            Générer <ArrowRight size={10} />
          </Link>
        </div>
      </div>

      {/* Credit usage chart */}
      <CreditUsageChart usages={usages} timelineData={timelineData} timelineAgents={timelineAgents} />

      {/* Agents */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Vos agents</h2>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            {activeCount} / {maxAgents === Infinity ? "∞" : maxAgents} actifs
          </span>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          {AGENT_CATALOG.map((catalog) => {
            // Priorité à l'agent actif si plusieurs du même type existent
            const existing = agents.find((a) => a.type === catalog.type && a.enabled) ?? agents.find((a) => a.type === catalog.type);
            const hasRequired = catalog.requiredIntegrations.some((r) => connectedTypes.has(r));
            const canEnable = activeCount < maxAgents || (existing?.enabled ?? false);

            if (!hasRequired && !existing?.enabled) {
              return null; // Hide agents that can't be used yet
            }

            return (
              <DashboardAgentToggle
                key={catalog.type}
                agent={existing ?? null}
                catalog={catalog}
                orgId={orgId ?? ""}
                hasRequiredIntegration={hasRequired}
                canEnable={canEnable}
                plan={plan}
              />
            );
          })}
        </div>

        <Link
          href="/dashboard/integrations"
          className="btn-secondary w-full text-center text-sm flex items-center justify-center gap-2"
        >
          <Sparkles size={14} /> Découvrir d&apos;autres agents
        </Link>
      </div>
    </div>
  );
}
