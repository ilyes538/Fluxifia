import { prisma } from "@/lib/db";

export const PLAN_LIMITS = {
  free:       { agents: 1, tokensPerMonth: 0, creditsPerMonth: 0 },
  starter:    { agents: 3, tokensPerMonth: 300_000, creditsPerMonth: 3_000 },
  pro:        { agents: 6, tokensPerMonth: 700_000, creditsPerMonth: 7_000 },
  enterprise: { agents: 12, tokensPerMonth: 1_500_000, creditsPerMonth: 15_000 },
} as const;

export type Plan = keyof typeof PLAN_LIMITS;

/** Coût en crédits par unité d'action pour chaque agent */
export const AGENT_CREDIT_COSTS: Record<string, number> = {
  email: 1,      // 1 email = 1 crédit
  slack: 2,      // 1 message Slack = 2 crédits
  notion: 1,     // 1 page/action Notion = 1 crédit
  calendar: 1,   // 1 event agenda = 1 crédit
  lead: 1,       // 1 lead qualifié = 1 crédit
  support: 1,    // 1 ticket support = 1 crédit
};

export async function getOrgPlan(orgId: string): Promise<Plan> {
  const sub = await prisma.subscription.findUnique({ where: { orgId } });
  if (!sub || sub.status === "canceled") return "free";
  return (sub.plan as Plan) ?? "free";
}

export async function getMonthlyTokensUsed(orgId: string): Promise<number> {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);

  const runs = await prisma.agentRun.findMany({
    where: {
      agent: { orgId },
      createdAt: { gte: start },
      status: "success",
    },
    select: { tokensUsed: true },
  });

  return runs.reduce((sum, r) => sum + r.tokensUsed, 0);
}

/** Somme des crédits consommés ce mois-ci via AgentRun */
export async function getMonthlyCreditsUsed(orgId: string): Promise<number> {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);

  const runs = await prisma.agentRun.findMany({
    where: {
      agent: { orgId },
      createdAt: { gte: start },
      status: "success",
    },
    select: { creditsUsed: true },
  });

  return runs.reduce((sum, r) => sum + r.creditsUsed, 0);
}

export function isUnlimited(email: string, role?: string): boolean {
  if (role === "owner" || role === "admin") return true;
  const admins = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  return admins.includes(email.toLowerCase());
}

export async function checkTokenLimit(orgId: string): Promise<{ allowed: boolean; used: number; limit: number }> {
  const plan = await getOrgPlan(orgId);
  const limit = PLAN_LIMITS[plan].tokensPerMonth;

  if (limit === Infinity) return { allowed: true, used: 0, limit: Infinity };

  const used = await getMonthlyTokensUsed(orgId);
  return { allowed: used < limit, used, limit };
}

/** Vérifie la limite de CRÉDITS génériques (indépendamment du type d'agent) */
export async function checkCreditLimit(orgId: string): Promise<{ allowed: boolean; used: number; limit: number }> {
  const plan = await getOrgPlan(orgId);
  const limit = PLAN_LIMITS[plan].creditsPerMonth;

  if (limit === Infinity) return { allowed: true, used: 0, limit: Infinity };

  const used = await getMonthlyCreditsUsed(orgId);
  return { allowed: used < limit, used, limit };
}

/** Vérifie si une action spécifique peut être effectuée avec les crédits restants */
export async function checkActionCredits(
  orgId: string,
  agentType: string,
  quantity: number
): Promise<{ allowed: boolean; used: number; limit: number; cost: number; remaining: number }> {
  const plan = await getOrgPlan(orgId);
  const limit = PLAN_LIMITS[plan].creditsPerMonth;

  if (limit === Infinity) {
    return { allowed: true, used: 0, limit: Infinity, cost: 0, remaining: Infinity };
  }

  const used = await getMonthlyCreditsUsed(orgId);
  const costPerUnit = AGENT_CREDIT_COSTS[agentType] ?? 1;
  const cost = quantity * costPerUnit;
  const remaining = Math.max(0, limit - used);

  return {
    allowed: cost <= remaining,
    used,
    limit,
    cost,
    remaining,
  };
}
