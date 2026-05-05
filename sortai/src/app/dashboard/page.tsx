import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Mail, Bot, Plug, Clock, TrendingUp, Activity, Zap } from "lucide-react";
import { getMonthlyTokensUsed, getOrgPlan, PLAN_LIMITS } from "@/lib/limits";
import Link from "next/link";

export const metadata = { title: "Vue d'ensemble" };

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const orgId = session!.user.orgId;

  const [agents, integrations, emailLogs, sub] = await Promise.all([
    orgId ? prisma.agent.findMany({ where: { orgId } }) : [],
    orgId ? prisma.integration.findMany({ where: { orgId } }) : [],
    orgId ? prisma.emailLog.findMany({ where: { orgId }, orderBy: { createdAt: "desc" }, take: 5 }) : [],
    orgId ? prisma.subscription.findUnique({ where: { orgId } }) : null,
  ]);

  const plan = await getOrgPlan(orgId ?? "");
  const tokensUsed = orgId ? await getMonthlyTokensUsed(orgId) : 0;
  const tokensLimit = PLAN_LIMITS[plan].tokensPerMonth;
  const tokensPercent = tokensLimit === Infinity ? 0 : Math.min(100, Math.round((tokensUsed / tokensLimit) * 100));

  const activeAgents = agents.filter((a) => a.enabled).length;
  const connectedIntegrations = integrations.filter((i) => i.connected).length;
  const totalEmailsProcessed = orgId
    ? await prisma.emailLog.count({ where: { orgId } })
    : 0;

  const stats = [
    { label: "Agents actifs", value: `${activeAgents} / ${agents.length}`, icon: Bot, color: "var(--accent-light)" },
    { label: "Emails traités", value: totalEmailsProcessed.toString(), icon: Mail, color: "var(--green)" },
    { label: "Intégrations", value: `${connectedIntegrations} connectée(s)`, icon: Plug, color: "#38bdf8" },
    { label: "Plan actuel", value: sub?.plan?.toUpperCase() ?? "FREE", icon: TrendingUp, color: "#fbbf24" },
  ];


  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Bonjour, {session!.user.name?.split(" ")[0] ?? "là"} 👋</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          Voici ce qui se passe dans votre espace SortAI
        </p>
      </div>

      {/* Token usage banner */}
      {tokensPercent > 0 && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Zap size={14} style={{ color: "var(--accent-light)" }} />
              Tokens IA ce mois
            </div>
            <Link href="/dashboard/usage" className="text-xs" style={{ color: "var(--accent-light)" }}>
              Détail →
            </Link>
          </div>
          <div className="w-full h-1.5 rounded-full mb-1" style={{ background: "rgba(255,255,255,0.1)" }}>
            <div
              className="h-1.5 rounded-full transition-all"
              style={{
                width: `${tokensPercent}%`,
                background: tokensPercent > 80 ? "#ef4444" : tokensPercent > 60 ? "#f59e0b" : "var(--accent)",
              }}
            />
          </div>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {tokensUsed.toLocaleString("fr-FR")} / {tokensLimit === Infinity ? "∞" : tokensLimit.toLocaleString("fr-FR")} tokens ({tokensPercent}%)
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>{s.label}</span>
              <s.icon size={14} style={{ color: s.color }} />
            </div>
            <div className="text-xl font-bold">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      {agents.length === 0 && (
        <div className="card border-dashed text-center py-10" style={{ borderColor: "rgba(124,58,237,0.4)" }}>
          <Bot size={32} className="mx-auto mb-3" style={{ color: "var(--accent)" }} />
          <h3 className="font-semibold mb-2">Activez votre premier agent IA</h3>
          <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
            Commencez par activer l&apos;agent Email pour traiter automatiquement vos messages.
          </p>
          <Link href="/dashboard/agents" className="btn-primary inline-flex">Configurer les agents</Link>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent email activity */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Activity size={16} style={{ color: "var(--accent-light)" }} />
              Activité récente
            </h2>
            <Link href="/dashboard/agents" className="text-xs" style={{ color: "var(--accent-light)" }}>Voir tout</Link>
          </div>
          {emailLogs.length === 0 ? (
            <p className="text-sm py-6 text-center" style={{ color: "var(--text-muted)" }}>
              Aucune activité pour le moment
            </p>
          ) : (
            <div className="space-y-3">
              {emailLogs.map((log) => (
                <div key={log.id} className="flex items-center gap-3 py-2 border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                  <Mail size={14} style={{ color: "var(--text-muted)" }} className="shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm truncate">{log.subject ?? "Sans sujet"}</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>{log.from}</p>
                  </div>
                  <span className={`badge ${
                    log.action === "replied" ? "badge-green" :
                    log.action === "categorized" ? "badge-violet" : "badge-gray"
                  }`}>
                    {log.action}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Agent status */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Bot size={16} style={{ color: "var(--accent-light)" }} />
              Agents IA
            </h2>
            <Link href="/dashboard/agents" className="text-xs" style={{ color: "var(--accent-light)" }}>Gérer</Link>
          </div>
          {agents.length === 0 ? (
            <p className="text-sm py-6 text-center" style={{ color: "var(--text-muted)" }}>
              Aucun agent configuré
            </p>
          ) : (
            <div className="space-y-3">
              {agents.slice(0, 5).map((agent) => (
                <div key={agent.id} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${agent.enabled ? "bg-green-500" : "bg-gray-600"}`} />
                    <span className="text-sm">{agent.name}</span>
                  </div>
                  <span className="badge badge-gray text-xs">{agent.type}</span>
                </div>
              ))}
            </div>
          )}
          <Link href="/dashboard/agents" className="btn-secondary w-full text-center text-sm mt-4 block">
            Gérer les agents
          </Link>
        </div>
      </div>

      {/* Integrations needed */}
      {connectedIntegrations === 0 && (
        <div className="card flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(56,189,248,0.1)" }}>
              <Plug size={18} style={{ color: "#38bdf8" }} />
            </div>
            <div>
              <p className="font-medium text-sm">Connectez vos outils</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Gmail, Outlook, Slack, Notion — pour activer les agents</p>
            </div>
          </div>
          <Link href="/dashboard/integrations" className="btn-secondary text-sm shrink-0">
            Connecter <Clock size={12} className="inline ml-1" />
          </Link>
        </div>
      )}
    </div>
  );
}
