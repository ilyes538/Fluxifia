export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const ruleSchema = z.object({
  name: z.string().min(1).max(100),
  enabled: z.boolean().default(true),
  keywords: z.array(z.string()).default([]),
  fromFilter: z.string().optional(),
  categories: z.array(z.string()).default([]),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  outputName: z.string().default("extraction"),
  columns: z.array(z.string()).default(["subject", "from", "category", "action", "createdAt"]),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const rules = await prisma.extractionRule.findMany({
    where: { orgId: session.user.orgId! },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ rules });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const parsed = ruleSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 400 });

  const { name, enabled, keywords, fromFilter, categories, dateFrom, dateTo, outputName, columns } = parsed.data;

  const rule = await prisma.extractionRule.create({
    data: {
      orgId: session.user.orgId!,
      name,
      enabled,
      keywords: JSON.stringify(keywords),
      fromFilter,
      categories: JSON.stringify(categories),
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
      outputName,
      columns: JSON.stringify(columns),
    },
  });

  return NextResponse.json({ rule }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const { id, ...data } = body;
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

  const existing = await prisma.extractionRule.findFirst({ where: { id, orgId: session.user.orgId! } });
  if (!existing) return NextResponse.json({ error: "Règle non trouvée" }, { status: 404 });

  const rule = await prisma.extractionRule.update({
    where: { id },
    data: {
      ...("name" in data && { name: data.name }),
      ...("enabled" in data && { enabled: data.enabled }),
      ...("keywords" in data && { keywords: JSON.stringify(data.keywords) }),
      ...("fromFilter" in data && { fromFilter: data.fromFilter }),
      ...("categories" in data && { categories: JSON.stringify(data.categories) }),
      ...("outputName" in data && { outputName: data.outputName }),
      ...("columns" in data && { columns: JSON.stringify(data.columns) }),
    },
  });

  return NextResponse.json({ rule });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await req.json();
  const existing = await prisma.extractionRule.findFirst({ where: { id, orgId: session.user.orgId! } });
  if (!existing) return NextResponse.json({ error: "Règle non trouvée" }, { status: 404 });

  await prisma.extractionRule.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
