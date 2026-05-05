export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { z } from "zod";
import crypto from "crypto";

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "member"]).default("member"),
});

export async function POST(req: NextRequest) {
  const { error, session } = await requireRole("admin");
  if (error) return error;

  const orgId = session!.user.orgId;
  if (!orgId) return NextResponse.json({ error: "Organisation non trouvée" }, { status: 400 });

  const body = await req.json();
  const parsed = inviteSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 });

  const { email, role } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: "Cet utilisateur a déjà un compte." }, { status: 409 });

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 48); // 48h

  // Store invite as a session with a special prefix
  // In production: create an Invitation model and send email
  const invite = await prisma.session.create({
    data: {
      userId: session!.user.id,
      token: `invite_${token}_${orgId}_${role}_${email}`,
      expiresAt,
    },
  });

  console.log(`[Invitation] ${email} invited to org ${orgId} as ${role}. Token: ${token}`);

  return NextResponse.json({
    message: "Invitation envoyée",
    inviteUrl: `${process.env.NEXTAUTH_URL}/auth/register?invite=${token}`,
    expiresAt,
  });
}

export async function GET() {
  const { error, session } = await requireRole("admin");
  if (error) return error;

  const orgId = session!.user.orgId;
  const members = await prisma.user.findMany({
    where: { orgId },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ members });
}
