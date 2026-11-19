import { defineConfig, devices } from "@playwright/test"
const baseURL = process.env.BASE_URL || "http://127.0.0.1:4173/"
export default defineConfig({
  testDir: "./tests",
  timeout: 30000,
  retries: process.env.CI ? 1 : 0,
  use: { baseURL, trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } },
             { name: "mobile-chromium", use: { ...devices["Pixel 7"] } }],
  webServer: process.env.BASE_URL ? undefined : { command: "npm run dev -- --host 127.0.0.1", url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env.CI, timeout: 30000 }
})
