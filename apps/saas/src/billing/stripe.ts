import Stripe from "stripe";
import { db } from "../db/client.js";
import { linusTenants } from "../db/schema.js";
import { eq } from "drizzle-orm";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2025-03-31.basil",
});

export function getPriceId(billingPeriod: "monthly" | "annual" = "monthly") {
  return billingPeriod === "annual"
    ? (process.env.STRIPE_PRICE_7990_ANNUAL ?? "")
    : (process.env.STRIPE_PRICE_799_MONTHLY ?? "");
}

export async function createCheckoutSession(tenantId: string, billingPeriod: "monthly" | "annual" = "monthly") {
  const [tenant] = await db().select().from(linusTenants).where(eq(linusTenants.id, tenantId)).limit(1);
  if (!tenant) throw new Error("Tenant not found");

  const priceId = tenant.foundingCustomer
    ? (process.env.STRIPE_PRICE_799_MONTHLY ?? "")
    : getPriceId(billingPeriod);

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    customer: tenant.stripeCustomerId ?? undefined,
    metadata: { tenantId },
    success_url: `${process.env.APP_URL ?? "http://localhost:4000"}/dashboard?upgraded=1`,
    cancel_url: `${process.env.APP_URL ?? "http://localhost:4000"}/billing`,
  });

  return session;
}

export async function createPortalSession(customerId: string) {
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.APP_URL ?? "http://localhost:4000"}/dashboard`,
  });
}

export async function addReservationsAddon(tenantId: string) {
  const [tenant] = await db().select().from(linusTenants).where(eq(linusTenants.id, tenantId)).limit(1);
  if (!tenant?.stripeSubId) throw new Error("No active subscription");

  const sub = await stripe.subscriptions.retrieve(tenant.stripeSubId);
  await stripe.subscriptionItems.create({
    subscription: tenant.stripeSubId,
    price: process.env.STRIPE_PRICE_199_RESERVATIONS ?? "",
    quantity: 1,
    proration_behavior: "always_invoice",
  });
}

export async function handleWebhook(rawBody: Buffer, sig: string) {
  const event = stripe.webhooks.constructEvent(
    rawBody,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET ?? ""
  );

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const tenantId = session.metadata?.tenantId;
    if (!tenantId || !session.customer || !session.subscription) return;

    const [tenant] = await db().select().from(linusTenants).where(eq(linusTenants.id, tenantId)).limit(1);
    if (!tenant) return;

    await db()
      .update(linusTenants)
      .set({
        stripeCustomerId: session.customer as string,
        stripeSubId: session.subscription as string,
        subStatus: "active",
        lockedPriceId: tenant.foundingCustomer ? (process.env.STRIPE_PRICE_799_MONTHLY ?? null) : null,
        updatedAt: new Date(),
      })
      .where(eq(linusTenants.id, tenantId));
  }

  if (event.type === "customer.subscription.updated") {
    const sub = event.data.object as Stripe.Subscription;
    const [tenant] = await db()
      .select()
      .from(linusTenants)
      .where(eq(linusTenants.stripeSubId, sub.id))
      .limit(1);
    if (!tenant) return;

    const hasReservationsItem = sub.items.data.some(
      (item) => item.price.id === process.env.STRIPE_PRICE_199_RESERVATIONS
    );

    await db()
      .update(linusTenants)
      .set({
        subStatus: sub.status,
        reservationsAddon: hasReservationsItem,
        updatedAt: new Date(),
      })
      .where(eq(linusTenants.id, tenant.id));
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    await db()
      .update(linusTenants)
      .set({ subStatus: "cancelled", updatedAt: new Date() })
      .where(eq(linusTenants.stripeSubId, sub.id));
  }
}
