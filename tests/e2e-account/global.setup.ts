import fs from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { createClerkClient } from "@clerk/backend";
import { clerk, clerkSetup } from "@clerk/testing/playwright";
import { test as setup, expect } from "@playwright/test";
import { authStateFile, removeSyntheticData, requireIsolatedEnvironment, saveResources, testEmail } from "./test-resources";

setup.describe.configure({ mode: "serial" });

setup("create and authenticate a disposable test account", async ({ page }) => {
  requireIsolatedEnvironment();
  process.env.CLERK_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  await clerkSetup({ dotenv: false });

  const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });
  const existing = await clerkClient.users.getUserList({ emailAddress: [testEmail] });
  for (const user of existing.data) {
    await removeSyntheticData(user.id);
    await clerkClient.users.deleteUser(user.id);
  }

  const user = await clerkClient.users.createUser({
    emailAddress: [testEmail],
    password: `RL!Aa1${randomBytes(18).toString("base64url")}`,
    firstName: "Residue Lens",
    lastName: "Automated Test",
  });
  saveResources({ clerkUserId: user.id });

  await page.goto("/");
  await clerk.signIn({ page, emailAddress: testEmail });
  await page.goto("/account");
  await expect(page.getByRole("heading", { name: "Choose which copy wins" })).toBeVisible();

  fs.mkdirSync(path.dirname(authStateFile), { recursive: true });
  await page.context().storageState({ path: authStateFile });
});
