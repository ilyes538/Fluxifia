export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const RETENTION_DAYS = 90; // 3 months

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET ?? ""}`;
  if (authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);

  const result = await prisma.report.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });

  return NextResponse.json({
    success: true,
    deleted: result.count,
    retentionDays: RETENTION_DAYS,
    cutoff: cutoff.toISOString(),
  });
}
