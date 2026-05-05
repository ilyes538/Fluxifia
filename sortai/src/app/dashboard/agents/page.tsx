import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AgentCard } from "@/components/dashboard/AgentCard";
import { Bot, Info } from "lucide-react";

export const metadata = { title: "Agents IA" };

const AGENT_CATALOG = [
  {
    type: "email",
    name: "Agent Email",
    description: "Catégorise, priorise et répond automatiquement à vos emails entrants. Détecte les urgences et redirige vers le bon interlocuteur.",
    requiredIntegrations: ["gmail", "outlook"],
    icon: "📧",
  },
  {
    type: "slack",
    name: "Agent Slack",
    description: "Répond aux questions de vos collaborateurs sur Slack, résume les fils de discussion et notifie les bonnes personnes.",
    requiredIntegrations: ["slack"],
    icon: "💬",
  },
  {
    type: "notion",
    name: "Agent Notion",
    description: "Crée et met à jour vos pages Notion, génère des comptes-rendus et organise votre base de connaissances automatiquement.",
    requiredIntegrations: ["notion"],
    icon: "📝",
  },
  {
    type: "calendar",
    name: "Agent Agenda",
    description: "Planifie vos réunions, envoie des rappels et optimise votre emploi du temps selon vos priorités.",
    requiredIntegrations: ["gmail", "outlook"],
    icon: "📅",
  },
  {
    type: "lead",
    name: "Agent Lead",
    description: "Qualifie automatiquement vos prospects entrants, score leur potentiel et déclenche les bonnes actions commerciales.",
    requiredIntegrations: ["gmail"],
    icon: "🎯",
  },
  {
    type: "support",
    name: "Agent Support",
    description: "Traite les demandes clients de premier niveau, propose des solutions et escalade les cas complexes à votre équipe.",
    requiredIntegrations: ["gmail", "outlook"],
    icon: "🛟",
  },
];

export default async function AgentsPage() {
  const session = await getServerSession(authOptions);
  const orgId = session!.user.orgId;

  const [existingAgents, integrations, sub] = await Promise.all([
    orgId ? prisma.agent.findMany({ where: { orgId } }) : [],
    orgId ? prisma.integration.findMany({ where: { orgId, connected: true } }) : [],
    orgId ? prisma.subscription.findUnique({ where: { orgId } }) : null,
  ]);

  const plan = sub?.plan ?? "free";
  const planLimits: Record<string, number> = { free: 1, starter: 3, pro: 10, enterprise: Infinity };
  const maxAgents = planLimits[plan] ?? 1;
  const activeCount = existingAgents.filter((a) => a.enabled).length;
  const connectedTypes = new Set(integrations.map((i) => i.type));

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Agents IA</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Activez et configurez vos agents selon vos besoins
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge badge-violet">
            <Bot size={10} />
            {activeCount} / {maxAgents === Infinity ? "∞" : maxAgents} actifs
          </span>
        </div>
      </div>

      {plan === "free" && (
        <div className="card flex items-start gap-3" style={{ borderColor: "rgba(251,191,36,0.3)", background: "rgba(251,191,36,0.05)" }}>
          <Info size={16} className="shrink-0 mt-0.5" style={{ color: "#fbbf24" }} />
          <p className="text-sm" style={{ color: "#fbbf24" }}>
            Plan Gratuit — 1 agent maximum. <a href="/dashboard/billing" className="underline">Passer au plan Starter</a> pour débloquer jusqu&apos;à 3 agents.
          </p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {AGENT_CATALOG.map((catalog) => {
          const existing = existingAgents.find((a) => a.type === catalog.type);
          const hasRequiredIntegration = catalog.requiredIntegrations.some((r) => connectedTypes.has(r));
          return (
            <AgentCard
              key={catalog.type}
              agent={existing ?? null}
              catalog={catalog}
              orgId={orgId ?? ""}
              hasRequiredIntegration={hasRequiredIntegration}
              canEnable={activeCount < maxAgents || (existing?.enabled ?? false)}
              plan={plan}
            />
          );
        })}
      </div>
    </div>
  );
}
