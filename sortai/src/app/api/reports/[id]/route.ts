export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const orgId = session.user.orgId;
    if (!orgId) return NextResponse.json({ error: "Organisation non trouvée" }, { status: 400 });

    const { id } = await params;
    const report = await prisma.report.findFirst({
      where: { id, orgId },
    });

    if (!report) {
      return NextResponse.json({ error: "Compte rendu introuvable" }, { status: 404 });
    }

    let emails = [];
    let stats = {};
    try {
      emails = JSON.parse(report.content);
    } catch { /* ignore */ }
    try {
      stats = JSON.parse(report.stats);
    } catch { /* ignore */ }

    return NextResponse.json({
      id: report.id,
      createdAt: report.createdAt,
      period: report.period,
      totalEmails: report.totalEmails,
      stats,
      summary: report.summary,
      emails,
      tokenCost: report.tokenCost,
    });
  } catch (err) {
    console.error("Report detail error:", err);
    const message = err instanceof Error ? err.message : "Erreur interne";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
