export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Lance une règle d'extraction par son ID → renvoie les emails correspondants (preview ou export)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { ruleId, preview = false } = await req.json();
  if (!ruleId) return NextResponse.json({ error: "ruleId requis" }, { status: 400 });

  const rule = await prisma.extractionRule.findFirst({
    where: { id: ruleId, orgId: session.user.orgId! },
  });
  if (!rule) return NextResponse.json({ error: "Règle non trouvée" }, { status: 404 });

  const keywords: string[] = JSON.parse(rule.keywords);
  const categories: string[] = JSON.parse(rule.categories);

  const where: Record<string, unknown> = { orgId: session.user.orgId! };

  if (keywords.length > 0) {
    where.OR = keywords.map((kw) => ({
      subject: { contains: kw, mode: "insensitive" },
    }));
  }
  if (rule.fromFilter) {
    where.from = { contains: rule.fromFilter, mode: "insensitive" };
  }
  if (categories.length > 0) {
    where.category = { in: categories };
  }
  if (rule.dateFrom || rule.dateTo) {
    where.createdAt = {
      ...(rule.dateFrom ? { gte: rule.dateFrom } : {}),
      ...(rule.dateTo ? { lte: rule.dateTo } : {}),
    };
  }

  const logs = await prisma.emailLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: preview ? 20 : 10000,
  });

  // Met à jour les stats de la règle
  if (!preview) {
    await prisma.extractionRule.update({
      where: { id: ruleId },
      data: { lastRunAt: new Date(), lastCount: logs.length },
    });
  }

  const columns: string[] = JSON.parse(rule.columns);

  return NextResponse.json({
    count: logs.length,
    columns,
    rows: logs,
    rule: { name: rule.name, outputName: rule.outputName },
  });
}
