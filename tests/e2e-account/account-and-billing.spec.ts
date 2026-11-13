import { expect, test } from "@playwright/test";
import postgres from "postgres";
import Stripe from "stripe";
import { loadResources, requireIsolatedEnvironment } from "./test-resources";

const household = {
  version: 2,
  activeProfileId: "automated-list",
  profiles: [
    { id: "automated-list", name: "Automated test list", foodIds: ["grapes", "broccoli"] },
    { id: "second-list", name: "Second test list", foodIds: ["lemons"] },
  ],
};

test("syncs a list and exercises Stripe sandbox billing", async ({ page }) => {
  const resources = loadResources();
  if (!resources) throw new Error("Synthetic test account was not created.");
  const databaseUrl = requireIsolatedEnvironment();

  await page.goto("/account");
  await page.evaluate((value) => {
    window.localStorage.setItem("residue-lens:household:v2", JSON.stringify(value));
  }, household);
  await page.reload();

  await page.getByRole("button", { name: "Upload this device" }).click();
  await expect(page.getByRole("status")).toContainText("Saved 2 lists with 3 foods to your account.");

  await page.evaluate(() => window.localStorage.removeItem("residue-lens:household:v2"));
  await page.reload();
  await page.getByRole("button", { name: "Load cloud lists" }).click();
  await expect(page.getByRole("status")).toContainText("Loaded 2 lists with 3 foods into this browser.");
  await expect.poll(() => page.evaluate(() => JSON.parse(window.localStorage.getItem("residue-lens:household:v2") ?? "null"))).toEqual(household);

  const checkoutResponse = await page.request.post("/api/checkout", { data: { plan: "annual" } });
  expect(checkoutResponse.status()).toBe(200);
  const checkout = await checkoutResponse.json() as { url?: string };
  expect(new URL(checkout.url!).hostname).toBe("checkout.stripe.com");

  const portalResponse = await page.request.post("/api/billing-portal");
  expect(portalResponse.status()).toBe(200);
  const portal = await portalResponse.json() as { url?: string };
  expect(new URL(portal.url!).hostname).toBe("billing.stripe.com");

  const sql = postgres(databaseUrl, { max: 1, prepare: false });
  let customerId = "";
  try {
    const rows = await sql<Array<{ stripe_customer_id: string }>>`
      SELECT stripe_customer_id FROM user_profiles WHERE user_id = ${resources.clerkUserId}
    `;
    customerId = rows[0]?.stripe_customer_id ?? "";
  } finally {
    await sql.end();
  }
  expect(customerId).toMatch(/^cus_/);

  const payload = JSON.stringify({
    id: `evt_residue_lens_${Date.now()}`,
    object: "event",
    api_version: "2026-08-27.basil",
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: `sub_residue_lens_${Date.now()}`,
        object: "subscription",
        customer: customerId,
        metadata: { clerkUserId: resources.clerkUserId },
        status: "active",
        cancel_at: null,
        items: { data: [{ current_period_end: Math.floor(Date.now() / 1000) + 86_400 }] },
      },
    },
    livemode: false,
    pending_webhooks: 1,
    request: null,
    type: "customer.subscription.updated",
  });
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { typescript: true });
  const signature = stripe.webhooks.generateTestHeaderString({ payload, secret: process.env.STRIPE_WEBHOOK_SECRET! });
  const webhookResponse = await page.request.post("/api/webhooks/stripe", {
    data: payload,
    headers: { "content-type": "application/json", "stripe-signature": signature },
  });
  expect(webhookResponse.status()).toBe(200);

  await page.goto("/account");
  await expect(page.getByRole("heading", { name: "Residue Lens Plus is active" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Manage subscription" })).toBeVisible();

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Delete cloud lists" }).click();
  await expect(page.getByRole("region", { name: "Choose which copy wins" }).getByRole("status"))
    .toContainText("Your synced lists were deleted.");
});
