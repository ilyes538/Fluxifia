import Stripe from "stripe";

export const getStripe = () => new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2025-02-24.acacia",
});

export const stripe = new Proxy({} as Stripe, {
  get: (_, prop) => getStripe()[prop as keyof Stripe],
});

export const STRIPE_PRICES: Record<string, string> = {
  starter: process.env.STRIPE_PRICE_STARTER ?? "",
  pro: process.env.STRIPE_PRICE_PRO ?? "",
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE ?? "",
};

export async function createOrRetrieveCustomer(
  orgId: string,
  orgName: string,
  email: string
): Promise<string> {
  const customers = await stripe.customers.list({ email, limit: 1 });
  if (customers.data.length > 0) return customers.data[0].id;

  const customer = await stripe.customers.create({
    email,
    name: orgName,
    metadata: { orgId },
  });
  return customer.id;
}

export async function createCheckoutSession(params: {
  customerId: string;
  priceId: string;
  orgId: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<string> {
  const session = await stripe.checkout.sessions.create({
    customer: params.customerId,
    payment_method_types: ["card"],
    line_items: [{ price: params.priceId, quantity: 1 }],
    mode: "subscription",
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: { orgId: params.orgId },
    subscription_data: { metadata: { orgId: params.orgId } },
    locale: "fr",
  });
  return session.url!;
}

export async function createBillingPortalSession(
  customerId: string,
  returnUrl: string
): Promise<string> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
  return session.url;
}
