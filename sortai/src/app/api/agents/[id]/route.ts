export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const agent = await prisma.agent.findUnique({ where: { id } });
  if (!agent || agent.orgId !== session.user.orgId) {
    return NextResponse.json({ error: "Agent non trouvé" }, { status: 404 });
  }

  const updated = await prisma.agent.update({
    where: { id },
    data: {
      ...(body.enabled !== undefined && { enabled: body.enabled }),
      ...(body.systemPrompt !== undefined && { systemPrompt: body.systemPrompt }),
      ...(body.config !== undefined && { config: JSON.stringify(body.config) }),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const agent = await prisma.agent.findUnique({ where: { id } });
  if (!agent || agent.orgId !== session.user.orgId) {
    return NextResponse.json({ error: "Agent non trouvé" }, { status: 404 });
  }

  await prisma.agent.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
