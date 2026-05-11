export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createOrRetrieveCustomer, createCheckoutSession, STRIPE_PRICES } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  orgId: z.string(),
  userEmail: z.string().email(),
  orgName: z.string(),
  targetPlan: z.enum(["starter", "pro", "enterprise"]),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 });

  const { orgId, userEmail, orgName, targetPlan } = parsed.data;

  if (session.user.orgId !== orgId) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const priceId = STRIPE_PRICES[targetPlan];
  if (!priceId) {
    return NextResponse.json({ error: "Plan non configuré" }, { status: 500 });
  }

  const customerId = await createOrRetrieveCustomer(orgId, orgName, userEmail);

  // Store stripe customer id
  await prisma.subscription.upsert({
    where: { orgId },
    create: { orgId, stripeCustomerId: customerId, plan: "free" },
    update: { stripeCustomerId: customerId },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const url = await createCheckoutSession({
    customerId,
    priceId,
    orgId,
    successUrl: `${appUrl}/dashboard/billing?success=1`,
    cancelUrl: `${appUrl}/dashboard/billing`,
  });

  return NextResponse.json({ url });
}
