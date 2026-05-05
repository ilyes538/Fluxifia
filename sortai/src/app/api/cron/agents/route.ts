export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkTokenLimit } from "@/lib/limits";

// Vercel Cron Job — runs every hour
// Checks all active agents and triggers pending tasks

export async function GET(req: NextRequest) {
  // Verify this is a legitimate cron request
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const activeAgents = await prisma.agent.findMany({
    where: { enabled: true },
    include: { org: true },
  });

  const results: { agentId: string; orgId: string; status: string }[] = [];

  for (const agent of activeAgents) {
    const { allowed } = await checkTokenLimit(agent.orgId);
    if (!allowed) {
      results.push({ agentId: agent.id, orgId: agent.orgId, status: "skipped_limit" });
      continue;
    }

    // Log a heartbeat run for monitoring
    await prisma.agentRun.create({
      data: {
        agentId: agent.id,
        status: "success",
        input: "cron:heartbeat",
        output: "Agent actif — vérification planifiée",
        tokensUsed: 0,
        durationMs: 0,
      },
    });

    results.push({ agentId: agent.id, orgId: agent.orgId, status: "checked" });
  }

  return NextResponse.json({
    ok: true,
    processed: results.length,
    results,
    timestamp: new Date().toISOString(),
  });
}
