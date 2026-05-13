export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!email) return NextResponse.json({ error: "Email requis" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email } });

  // Always return success to avoid user enumeration
  if (!user) return NextResponse.json({ message: "Si ce compte existe, un email a été envoyé." });

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

  await prisma.session.create({
    data: {
      userId: user.id,
      token: `reset_${token}`,
      expiresAt,
    },
  });

  // In production: send email with reset link
  // Reset URL: /auth/reset-password?token=${token}
  console.log(`[Password Reset] Token for ${email}: ${token}`);

  return NextResponse.json({ message: "Si ce compte existe, un email a été envoyé." });
}
