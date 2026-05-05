export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createBillingPortalSession } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const orgId = body.orgId ?? session.user.orgId;

  if (!orgId || session.user.orgId !== orgId) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const sub = await prisma.subscription.findUnique({ where: { orgId } });
  if (!sub?.stripeCustomerId) {
    return NextResponse.json({ error: "Aucun abonnement Stripe trouvé" }, { status: 404 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const url = await createBillingPortalSession(sub.stripeCustomerId, `${appUrl}/dashboard/billing`);

  return NextResponse.json({ url });
}
