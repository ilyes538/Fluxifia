export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isUnlimited } from "@/lib/limits";
import { z } from "zod";

const createSchema = z.object({
  type: z.enum(["email", "slack", "notion", "calendar", "lead", "support"]),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  orgId: z.string(),
  enabled: z.boolean().default(false),
  systemPrompt: z.string().optional(),
});

const patchSchema = createSchema.extend({ id: z.string() });

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 });

  const { type, name, description, orgId, enabled, systemPrompt } = parsed.data;

  if (session.user.orgId !== orgId) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  // Check plan limits (skip for admin/owner)
  if (enabled && !isUnlimited(session.user.email, session.user.role)) {
    const sub = await prisma.subscription.findUnique({ where: { orgId } });
    const plan = (sub?.plan ?? "free");
    const maxAgents = plan === "enterprise" ? Infinity : (plan === "pro" ? 10 : plan === "starter" ? 3 : 1);
    const activeCount = await prisma.agent.count({ where: { orgId, enabled: true } });
    if (maxAgents !== Infinity && activeCount >= maxAgents) {
      return NextResponse.json({ error: `Limite du plan ${plan} atteinte` }, { status: 403 });
    }
  }

  // Upsert: évite les doublons d'agents du même type
  const existing = await prisma.agent.findFirst({ where: { orgId, type } });
  if (existing) {
    const updated = await prisma.agent.update({
      where: { id: existing.id },
      data: { enabled, systemPrompt },
    });
    return NextResponse.json(updated);
  }

  const agent = await prisma.agent.create({
    data: { type, name, description: description ?? "", orgId, enabled, systemPrompt },
  });

  return NextResponse.json(agent, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 });

  const { id, orgId, enabled, systemPrompt } = parsed.data;

  const agent = await prisma.agent.findUnique({ where: { id } });
  if (!agent || agent.orgId !== session.user.orgId) {
    return NextResponse.json({ error: "Agent non trouvé" }, { status: 404 });
  }

  // Check plan limits when enabling (skip for admin/owner)
  if (enabled && !agent.enabled && !isUnlimited(session.user.email, session.user.role)) {
    const sub = await prisma.subscription.findUnique({ where: { orgId } });
    const plan = (sub?.plan ?? "free");
    const maxAgents = plan === "enterprise" ? Infinity : (plan === "pro" ? 10 : plan === "starter" ? 3 : 1);
    const activeCount = await prisma.agent.count({ where: { orgId, enabled: true } });
    if (maxAgents !== Infinity && activeCount >= maxAgents) {
      return NextResponse.json({ error: `Limite du plan ${plan} atteinte` }, { status: 403 });
    }
  }

  const updated = await prisma.agent.update({
    where: { id },
    data: { enabled, systemPrompt },
  });

  return NextResponse.json(updated);
}
