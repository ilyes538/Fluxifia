export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const search = searchParams.get("search") ?? "";
  const category = searchParams.get("category") ?? "";
  const action = searchParams.get("action") ?? "";
  const from = searchParams.get("from") ?? "";
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = 50;

  const where: Record<string, unknown> = { orgId: session.user.orgId! };

  if (search) {
    where.OR = [
      { subject: { contains: search, mode: "insensitive" } },
      { from: { contains: search, mode: "insensitive" } },
    ];
  }
  if (category) where.category = category;
  if (action) where.action = action;
  if (from) where.from = { contains: from, mode: "insensitive" };
  if (dateFrom || dateTo) {
    where.createdAt = {
      ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
      ...(dateTo ? { lte: new Date(dateTo) } : {}),
    };
  }

  const [total, logs] = await Promise.all([
    prisma.emailLog.count({ where }),
    prisma.emailLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return NextResponse.json({ logs, total, page, pages: Math.ceil(total / limit) });
}
