import Stripe from "stripe";

let stripe: Stripe | null | undefined;

export function getStripe() {
  if (stripe !== undefined) return stripe;
  stripe = process.env.STRIPE_SECRET_KEY
    ? new Stripe(process.env.STRIPE_SECRET_KEY, { typescript: true })
    : null;
  return stripe;
}
