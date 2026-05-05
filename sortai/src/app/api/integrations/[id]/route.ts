export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const integration = await prisma.integration.findUnique({ where: { id } });
  if (!integration || integration.orgId !== session.user.orgId) {
    return NextResponse.json({ error: "Intégration non trouvée" }, { status: 404 });
  }

  await prisma.integration.update({
    where: { id },
    data: { connected: false, accessToken: null, refreshToken: null, expiresAt: null },
  });

  return NextResponse.json({ success: true });
}
