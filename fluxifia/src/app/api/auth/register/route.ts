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

// Simple in-memory rate limiter for registration
const ipAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_REGISTRATIONS_PER_IP = 3;
const WINDOW_MS = 24 * 60 * 60 * 1000;

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() ?? "unknown";
}

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = ipAttempts.get(ip);
  if (!record || now > record.resetAt) {
    ipAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: MAX_REGISTRATIONS_PER_IP - 1 };
  }
  if (record.count >= MAX_REGISTRATIONS_PER_IP) {
    return { allowed: false, remaining: 0 };
  }
  record.count++;
  return { allowed: true, remaining: MAX_REGISTRATIONS_PER_IP - record.count };
}

export async function POST(req: NextRequest) {
  const clientIp = getClientIp(req);
  const rateLimit = checkRateLimit(clientIp);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Trop de tentatives. Réessayez demain." }, { status: 429 });
  }

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
