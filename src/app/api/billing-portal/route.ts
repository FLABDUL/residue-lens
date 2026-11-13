import { getDatabase } from "@/lib/db";
import { getOptionalUserId } from "@/lib/server-auth";
import { getStripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const userId = await getOptionalUserId();
  if (!userId) return Response.json({ error: "Sign in to manage billing." }, { status: 401 });
  const sql = getDatabase();
  const stripe = getStripe();
  if (!sql || !stripe) return Response.json({ error: "Billing is not connected on this preview." }, { status: 503 });
  const rows = await sql`SELECT stripe_customer_id FROM user_profiles WHERE user_id = ${userId}`;
  const customerId = rows[0]?.stripe_customer_id ? String(rows[0].stripe_customer_id) : "";
  if (!customerId) return Response.json({ error: "No billing account was found." }, { status: 404 });
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;
  const session = await stripe.billingPortal.sessions.create({ customer: customerId, return_url: `${origin}/account` });
  return Response.json({ url: session.url });
}
