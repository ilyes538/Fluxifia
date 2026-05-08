export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMonthlyCreditsUsed, getOrgPlan, PLAN_LIMITS } from "@/lib/limits";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const orgId = session.user.orgId;
  if (!orgId) return NextResponse.json({ error: "Organisation non trouvée" }, { status: 400 });

  const plan = await getOrgPlan(orgId);
  const limits = PLAN_LIMITS[plan];
  const creditsUsed = await getMonthlyCreditsUsed(orgId);

  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);

  const [agentRuns, activeAgents] = await Promise.all([
    prisma.agentRun.count({ where: { agent: { orgId }, createdAt: { gte: start } } }),
    prisma.agent.count({ where: { orgId, enabled: true } }),
  ]);

  return NextResponse.json({
    plan,
    limits,
    usage: {
      creditsUsed,
      creditsLimit: limits.creditsPerMonth,
      creditsPercent: limits.creditsPerMonth === Infinity ? 0 : Math.round((creditsUsed / limits.creditsPerMonth) * 100),
      agentRuns,
      activeAgents,
      agentsLimit: limits.agents,
    },
  });
}
