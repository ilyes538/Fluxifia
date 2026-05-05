import { prisma } from "@/lib/db";

export const PLAN_LIMITS = {
  free:       { agents: 1, tokensPerMonth: 10_000,  emailsPerMonth: 100 },
  starter:    { agents: 3, tokensPerMonth: 100_000,  emailsPerMonth: 1_000 },
  pro:        { agents: 10, tokensPerMonth: 500_000, emailsPerMonth: 10_000 },
  enterprise: { agents: Infinity, tokensPerMonth: Infinity, emailsPerMonth: Infinity },
} as const;

export type Plan = keyof typeof PLAN_LIMITS;

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

export async function checkTokenLimit(orgId: string): Promise<{ allowed: boolean; used: number; limit: number }> {
  const plan = await getOrgPlan(orgId);
  const limit = PLAN_LIMITS[plan].tokensPerMonth;

  if (limit === Infinity) return { allowed: true, used: 0, limit: Infinity };

  const used = await getMonthlyTokensUsed(orgId);
  return { allowed: used < limit, used, limit };
}
