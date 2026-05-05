export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.redirect(new URL("/auth/login?error=token_missing", req.url));

  const session = await prisma.session.findUnique({
    where: { token: `verify_${token}` },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    return NextResponse.redirect(new URL("/auth/login?error=token_expired", req.url));
  }

  await prisma.user.update({
    where: { id: session.userId },
    data: { emailVerified: true },
  });

  await prisma.session.delete({ where: { id: session.id } });

  return NextResponse.redirect(new URL("/dashboard?verified=1", req.url));
}

export async function POST(req: NextRequest) {
  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: "userId requis" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  if (user.emailVerified) return NextResponse.json({ message: "Email déjà vérifié" });

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h

  await prisma.session.create({
    data: { userId, token: `verify_${token}`, expiresAt },
  });

  const verifyUrl = `${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${token}`;
  console.log(`[Email Verification] Verify URL for ${user.email}: ${verifyUrl}`);

  return NextResponse.json({ message: "Email de vérification envoyé", verifyUrl });
}
