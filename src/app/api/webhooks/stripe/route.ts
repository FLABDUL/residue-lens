import type Stripe from "stripe";
import { getDatabase } from "@/lib/db";
import { getStripe } from "@/lib/stripe";

async function saveSubscription(subscription: Stripe.Subscription) {
  const sql = getDatabase();
  const userId = subscription.metadata.clerkUserId;
  if (!sql || !userId) return;
  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  const currentPeriodEnd = subscription.items.data[0]?.current_period_end;
  const cancelAt = subscription.cancel_at;
  await sql`INSERT INTO user_profiles (user_id, stripe_customer_id, stripe_subscription_id, subscription_status, current_period_end, cancel_at)
    VALUES (${userId}, ${customerId}, ${subscription.id}, ${subscription.status}, ${currentPeriodEnd ? new Date(currentPeriodEnd * 1000) : null}, ${cancelAt ? new Date(cancelAt * 1000) : null})
    ON CONFLICT (user_id) DO UPDATE SET stripe_customer_id = EXCLUDED.stripe_customer_id, stripe_subscription_id = EXCLUDED.stripe_subscription_id, subscription_status = EXCLUDED.subscription_status, current_period_end = EXCLUDED.current_period_end, cancel_at = EXCLUDED.cancel_at, updated_at = NOW()`;
}

export async function POST(request: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  if (!stripe || !secret || !signature) return Response.json({ error: "Webhook is not configured." }, { status: 503 });
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await request.text(), signature, secret);
  } catch {
    return Response.json({ error: "Invalid signature." }, { status: 400 });
  }
  if (["customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted"].includes(event.type)) {
    await saveSubscription(event.data.object as Stripe.Subscription);
  }
  return Response.json({ received: true });
}
