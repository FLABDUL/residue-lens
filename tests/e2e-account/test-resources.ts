import fs from "node:fs";
import path from "node:path";
import postgres from "postgres";
import Stripe from "stripe";
import { assertDatabaseTarget } from "../../src/lib/database-target.mjs";

export const testEmail = "residue-lens+clerk_test@example.com";
export const authStateFile = path.resolve("playwright/.clerk/residue-lens-user.json");
export const resourceFile = path.resolve("playwright/.residue-lens/account-test.json");

export type TestResources = { clerkUserId: string };

export function requireIsolatedEnvironment() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is required for the isolated account test.");
  assertDatabaseTarget(databaseUrl, "development");

  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.startsWith("pk_test_")) {
    throw new Error("The account test requires a Clerk development instance.");
  }
  if (!process.env.CLERK_SECRET_KEY) throw new Error("CLERK_SECRET_KEY is required for the account test.");
  if (!process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_")) {
    throw new Error("The account test requires a Stripe sandbox secret key.");
  }
  if (!process.env.STRIPE_WEBHOOK_SECRET) throw new Error("STRIPE_WEBHOOK_SECRET is required for the account test.");
  if (!process.env.STRIPE_MONTHLY_PRICE_ID || !process.env.STRIPE_ANNUAL_PRICE_ID) {
    throw new Error("Both Stripe sandbox price IDs are required for the account test.");
  }

  return databaseUrl;
}

export function saveResources(resources: TestResources) {
  fs.mkdirSync(path.dirname(resourceFile), { recursive: true });
  fs.writeFileSync(resourceFile, JSON.stringify(resources), { encoding: "utf8", mode: 0o600 });
}

export function loadResources(): TestResources | null {
  if (!fs.existsSync(resourceFile)) return null;
  return JSON.parse(fs.readFileSync(resourceFile, "utf8")) as TestResources;
}

export async function removeSyntheticData(userId: string) {
  const databaseUrl = requireIsolatedEnvironment();
  const sql = postgres(databaseUrl, { max: 1, prepare: false });
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { typescript: true });

  try {
    const rows = await sql<Array<{ stripe_customer_id: string | null }>>`
      SELECT stripe_customer_id FROM user_profiles WHERE user_id = ${userId}
    `;
    const customerId = rows[0]?.stripe_customer_id;
    if (customerId) {
      await stripe.customers.del(customerId).catch((error: unknown) => {
        if (!(error instanceof Stripe.errors.StripeInvalidRequestError)) throw error;
      });
    }
    await sql.begin(async (transaction) => {
      await transaction`DELETE FROM saved_lists WHERE user_id = ${userId}`;
      await transaction`DELETE FROM user_profiles WHERE user_id = ${userId}`;
    });
  } finally {
    await sql.end();
  }
}
