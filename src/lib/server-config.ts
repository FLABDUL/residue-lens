export const clerkConfigured = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
);

export const databaseConfigured = Boolean(process.env.DATABASE_URL);

export const stripeConfigured = Boolean(
  process.env.STRIPE_SECRET_KEY
  && process.env.STRIPE_WEBHOOK_SECRET
  && process.env.STRIPE_MONTHLY_PRICE_ID
  && process.env.STRIPE_ANNUAL_PRICE_ID,
);

export const plusCheckoutEnabled = stripeConfigured && process.env.PLUS_CHECKOUT_ENABLED === "true";

export const submissionsConfigured = databaseConfigured;
