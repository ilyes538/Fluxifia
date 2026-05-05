export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const orgId = session.user.orgId;
  if (!orgId) return NextResponse.json({ emails: [] });

  const emails = await prisma.emailLog.findMany({
    where: { orgId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ emails });
}
