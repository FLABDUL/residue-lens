import { defineConfig, devices } from "@playwright/test";

process.loadEnvFile(".env.local");

const baseURL = "http://localhost:3200";

export default defineConfig({
  testDir: "./tests/e2e-account",
  fullyParallel: false,
  workers: 1,
  forbidOnly: true,
  retries: 0,
  reporter: "list",
  outputDir: "test-results/account",
  use: {
    baseURL,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev -- --port 3200",
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      ...process.env,
      VERCEL_ENV: "development",
      NEXT_DIST_DIR: ".next-playwright-account",
      NEXT_PUBLIC_SITE_URL: baseURL,
      PLUS_CHECKOUT_ENABLED: "true",
    },
  },
  projects: [
    {
      name: "account setup",
      testMatch: /global\.setup\.ts/,
      teardown: "account teardown",
    },
    {
      name: "account teardown",
      testMatch: /global\.teardown\.ts/,
    },
    {
      name: "authenticated account and billing",
      testMatch: /account-and-billing\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: "playwright/.clerk/residue-lens-user.json",
      },
      dependencies: ["account setup"],
    },
  ],
});
