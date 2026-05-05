export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim());

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !ADMIN_EMAILS.includes(session.user.email ?? "")) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const [orgs, users, subs, agentRuns] = await Promise.all([
    prisma.organization.count(),
    prisma.user.count(),
    prisma.subscription.groupBy({ by: ["plan"], _count: { id: true } }),
    prisma.agentRun.count(),
  ]);

  const recentOrgs = await prisma.organization.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    include: {
      subscription: true,
      _count: { select: { users: true, agents: true } },
    },
  });

  return NextResponse.json({
    stats: { orgs, users, agentRuns },
    planBreakdown: subs,
    recentOrgs,
  });
}
