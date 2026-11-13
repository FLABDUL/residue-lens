import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3100";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  workers: 2,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  outputDir: "test-results",
  use: {
    baseURL,
    serviceWorkers: "block",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "npm run dev -- --port 3100",
        url: baseURL,
        reuseExistingServer: false,
        timeout: 120_000,
        env: {
          NEXT_DIST_DIR: ".next-playwright",
          NEXT_PUBLIC_PUBLIC_LAUNCH: "true",
          NEXT_PUBLIC_SUPPORT_URL: "https://buymeacoffee.com/madebyhakim",
          NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "",
          CLERK_SECRET_KEY: "",
          DATABASE_URL: "",
          STRIPE_SECRET_KEY: "sk_test_configured_but_unused",
          STRIPE_WEBHOOK_SECRET: "whsec_configured_but_unused",
          STRIPE_MONTHLY_PRICE_ID: "price_configured_but_unused_monthly",
          STRIPE_ANNUAL_PRICE_ID: "price_configured_but_unused_annual",
          PLUS_CHECKOUT_ENABLED: "false",
        },
      },
  projects: [
    {
      name: "chromium-desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
    {
      name: "chromium-mobile",
      use: { ...devices["Pixel 7"] },
    },
    {
      name: "chromium-tablet",
      use: { ...devices["Desktop Chrome"], viewport: { width: 768, height: 1024 } },
    },
    {
      name: "firefox-desktop",
      use: { ...devices["Desktop Firefox"], viewport: { width: 1440, height: 900 } },
    },
    {
      name: "webkit-mobile",
      use: { ...devices["iPhone 13"] },
    },
  ],
});
