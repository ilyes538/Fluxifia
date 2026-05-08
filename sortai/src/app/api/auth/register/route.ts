export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { slugify } from "@/lib/utils";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  orgName: z.string().min(2).max(150),
  industry: z.string().optional(),
  size: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides." }, { status: 400 });
  }

  const { name, email, password, orgName, industry, size } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return NextResponse.json({ error: "Cet email est déjà utilisé." }, { status: 409 });
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  // Generate a unique slug for the org
  let slug = slugify(orgName);
  const count = await prisma.organization.count({ where: { slug: { startsWith: slug } } });
  if (count > 0) slug = `${slug}-${count}`;

  const [org, user] = await prisma.$transaction(async (tx) => {
    const newOrg = await tx.organization.create({
      data: { name: orgName, slug, industry, size },
    });

    const newUser = await tx.user.create({
      data: {
        name,
        email: normalizedEmail,
        password: hashedPassword,
        role: "member",
        orgId: newOrg.id,
      },
    });

    await tx.subscription.create({
      data: { orgId: newOrg.id, plan: "free" },
    });

    return [newOrg, newUser];
  });

  // Send email verification
  const verifyToken = crypto.randomBytes(32).toString("hex");
  await prisma.session.create({
    data: {
      userId: user.id,
      token: `verify_${verifyToken}`,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
    },
  });
  const verifyUrl = `${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${verifyToken}`;
  console.log(`[Register] Verify URL for ${normalizedEmail}: ${verifyUrl}`);

  return NextResponse.json({ userId: user.id, orgId: org.id }, { status: 201 });
}
