import fs from "node:fs";
import { createClerkClient } from "@clerk/backend";
import { test as teardown } from "@playwright/test";
import { authStateFile, loadResources, removeSyntheticData, resourceFile } from "./test-resources";

teardown("remove disposable account, database rows and Stripe objects", async () => {
  const resources = loadResources();
  if (!resources) return;

  try {
    await removeSyntheticData(resources.clerkUserId);
    const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });
    await clerkClient.users.deleteUser(resources.clerkUserId).catch(() => undefined);
  } finally {
    if (fs.existsSync(authStateFile)) fs.unlinkSync(authStateFile);
    if (fs.existsSync(resourceFile)) fs.unlinkSync(resourceFile);
  }
});
