import { getDatabase } from "@/lib/db";
import { getOptionalUserId } from "@/lib/server-auth";
import { getStripe } from "@/lib/stripe";
import { plusCheckoutEnabled } from "@/lib/server-config";

export async function POST(request: Request) {
  if (!plusCheckoutEnabled) {
    return Response.json(
      { error: "Plus is not on sale while Residue Lens validates which recurring tools people value." },
      { status: 503 },
    );
  }
  const userId = await getOptionalUserId();
  if (!userId) return Response.json({ error: "Sign in before starting checkout." }, { status: 401 });
  const sql = getDatabase();
  const stripe = getStripe();
  if (!sql || !stripe) return Response.json({ error: "Billing is not connected on this preview." }, { status: 503 });
  const body = await request.json().catch(() => ({})) as { plan?: string };
  const price = body.plan === "monthly" ? process.env.STRIPE_MONTHLY_PRICE_ID : process.env.STRIPE_ANNUAL_PRICE_ID;
  if (!price) return Response.json({ error: "That plan is not configured." }, { status: 503 });

  const profiles = await sql`SELECT stripe_customer_id FROM user_profiles WHERE user_id = ${userId}`;
  let customerId = profiles[0]?.stripe_customer_id ? String(profiles[0].stripe_customer_id) : "";
  if (!customerId) {
    const customer = await stripe.customers.create({ metadata: { clerkUserId: userId } });
    customerId = customer.id;
    await sql`INSERT INTO user_profiles (user_id, stripe_customer_id) VALUES (${userId}, ${customerId}) ON CONFLICT (user_id) DO UPDATE SET stripe_customer_id = EXCLUDED.stripe_customer_id, updated_at = NOW()`;
  }
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: userId,
    line_items: [{ price, quantity: 1 }],
    subscription_data: { metadata: { clerkUserId: userId } },
    allow_promotion_codes: true,
    success_url: `${origin}/account?checkout=success`,
    cancel_url: `${origin}/pro?checkout=cancelled`,
  });
  return Response.json({ url: session.url });
}
