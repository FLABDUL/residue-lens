import { expect, test, type Page } from "@playwright/test";

const browserErrors = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  browserErrors.set(page, errors);
  page.on("console", (message) => {
    const isKnownClerkCookieWarning = message.location().url.includes(".clerk.accounts.dev/")
      && message.text().includes("Cookie “_cfuvid” has been rejected for invalid domain.");
    const isUnavailableLocalVercelScript = /\/_vercel\/(insights|speed-insights)\//.test(`${message.location().url} ${message.text()}`);
    if (message.type() === "error" && !isKnownClerkCookieWarning && !isUnavailableLocalVercelScript) errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route(/(_vercel\/(insights|speed-insights)|vercel-insights|va\.vercel-scripts|vitals\.vercel-insights)/, (route) => route.fulfill({ status: 200, contentType: "application/javascript", body: "" }));

});

test.afterEach(async ({ page }) => {
  expect(browserErrors.get(page) ?? []).toEqual([]);
});

async function openComparison(page: Page) {
  await page.goto("/compare");
  await expect(page).toHaveURL(/\/compare\?foods=/, { timeout: 15_000 });
  await expect(page.locator("body")).not.toBeEmpty();
  await expect(page.locator("[data-nextjs-dialog]")).toHaveCount(0);
}

async function openFoodChooser(page: Page) {
  const chooser = page.getByRole("button", { name: /Choose foods \(\d+\)/ });
  if (await chooser.isVisible()) await chooser.click();
  await expect(page.getByRole("searchbox", { name: "Search foods" })).toBeVisible();
}

test("presents a simple decision-first homepage", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("Compare where buying organic may make the biggest difference | Residue Lens");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /official pesticide-residue monitoring.*save a personal shortlist/i);
  await expect(page.getByRole("heading", { name: "Compare where buying organic may make the biggest difference." })).toBeVisible();
  await expect(page.locator("main h1")).toHaveCount(1);
  await expect(page.getByRole("link", { name: "Compare my foods" })).toHaveAttribute("href", "/compare");
  await expect(page.getByRole("link", { name: "How it works" })).toHaveAttribute("href", "/guides");
  await expect(page.locator(".lens-leaf-mark")).toHaveCount(2);
  await expect(page.locator(".home-proof article")).toHaveCount(3);
  await expect(page.getByText("Official evidence", { exact: true })).toBeVisible();
  await expect(page.getByText("Personal shortlist", { exact: true })).toBeVisible();
  await expect(page.getByText("Calm context", { exact: true })).toBeVisible();
  await expect(page.getByRole("searchbox", { name: "Search foods" })).toHaveCount(0);
  await expect(page.locator(".explorer-shell, .principles, .information")).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: "Main navigation" })).toBeVisible();
  await expect(page.getByRole("button", { name: /switch to .* theme/i })).toBeVisible();
  await expect(page.locator(".theme-toggle svg")).toBeVisible();
});

test("keeps primary actions readable and navigation targets large enough", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("residue-lens-theme", "dark"));
  await page.goto("/");

  const contrast = await page.getByRole("link", { name: "Compare my foods" }).evaluate((element) => {
    const parse = (colour: string) => colour.match(/[\d.]+/g)?.slice(0, 3).map(Number) ?? [0, 0, 0];
    const luminance = (rgb: number[]) => rgb.map((channel) => {
      const value = channel / 255;
      return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    }).reduce((total, value, index) => total + value * [0.2126, 0.7152, 0.0722][index], 0);
    const style = getComputedStyle(element);
    const foreground = luminance(parse(style.color));
    const background = luminance(parse(style.backgroundColor));
    return (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
  });
  expect(contrast).toBeGreaterThanOrEqual(4.5);

  const smallTargets = await page.locator(".site-header nav a, .footer-links a").evaluateAll((links) => links
    .map((link) => ({ label: link.textContent?.trim(), ...link.getBoundingClientRect().toJSON() }))
    .filter((box) => box.width < 24 || box.height < 24));
  expect(smallTargets).toEqual([]);
});

test("preserves a legacy shared comparison URL", async ({ page }) => {
  await page.goto("/?foods=grapes%2Cbananas&metric=multiplePct&programme=uk-prif&region=GB");
  await expect(page).toHaveURL(/\/compare\?foods=grapes%2Cbananas&metric=multiplePct&programme=uk-prif&region=GB/);
});

test("uses one complete navigation and persists the theme", async ({ page }) => {
  await page.goto("/guides");
  const navigation = page.getByRole("navigation", { name: "Main navigation" });
  for (const label of ["Compare", "My list", "Guides", "Methodology"]) {
    await expect(navigation.getByRole("link", { name: label, exact: true })).toBeVisible();
  }
  await expect(navigation.getByRole("link", { name: "Plus", exact: true })).toHaveCount(0);
  await expect(navigation.getByRole("link", { name: "Guides", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(page.getByText("Saved foods", { exact: false })).toHaveCount(0);

  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.getByRole("button", { name: "Switch to light theme" })).toBeVisible();
});

test("keeps the homepage and comparison within the viewport", async ({ page }) => {
  for (const path of ["/", "/compare"]) {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  }
});

test("opens directly on the comparison tool", async ({ page }) => {
  await openComparison(page);
  await expect(page.getByRole("heading", { level: 1, name: "Choose foods. Change the question." })).toBeVisible();
  await expect(page.getByRole("button", { name: "Choose foods (3)" })).toBeVisible();
  await expect(page.getByRole("searchbox", { name: "Search foods" })).toHaveCount(0);
  await expect(page.getByText("Example comparison — choose your own foods.", { exact: true })).toBeVisible();
  await expect(page.locator(".hero, #quick-read")).toHaveCount(0);
  await expect(page.locator(".metric-tabs button")).toHaveCount(6);
  await expect(page.getByText("More measures", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Understand the results" })).toHaveAttribute("href", "/guides");
  await expect(page.getByRole("link", { name: "Was anything unclear or surprising? Tell me." })).toHaveAttribute("href", "/feedback");
});

test("keeps comparison and residue detail while removing learning clutter", async ({ page }) => {
  await page.goto("/compare?foods=grapes%2Cbananas&metric=detectedPct&programme=uk-prif&region=GB");
  await expect(page.getByRole("heading", { name: /choose foods/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /share comparison/i })).toBeVisible();
  await expect(page.getByText(/lower organic-buying priority/i).first()).toBeVisible();
  await expect(page.getByText(/Priority reflects monitoring patterns and sample coverage—not health risk, nutritional value, price or an instruction to buy organic/i).first()).toBeVisible();
  await expect(page.locator(".chart-heading").getByText(/standard-grown samples/i)).toBeVisible();
  await expect(page.getByText(/conventional samples/i)).toHaveCount(0);
  await expect(page.locator("#residue-title")).toBeVisible();
  await expect(page.getByText("Decision guides", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("tab", { name: "Change log" })).toHaveCount(0);
});

test("searches for and selects a food", async ({ page }) => {
  await page.addInitScript(() => {
    const analyticsWindow = window as typeof window & {
      va: (...args: unknown[]) => void;
      trackedEvents: unknown[][];
    };
    analyticsWindow.trackedEvents = [];
    analyticsWindow.va = (...args: unknown[]) => analyticsWindow.trackedEvents.push(args);
  });
  await openComparison(page);
  await openFoodChooser(page);
  await page.getByRole("button", { name: "Clear" }).click();
  await page.getByRole("searchbox", { name: "Search foods" }).fill("apples");
  const option = page.locator(".food-option").filter({
    has: page.getByText("Apples", { exact: true }),
  });
  await expect(option).toBeVisible();
  await option.click();

  await expect(page.locator('.chart-row[aria-label^="Apples:"]')).toBeVisible();
  const events = await page.evaluate(() => (window as typeof window & { trackedEvents: unknown[][] }).trackedEvents);
  expect(events).toContainEqual([
    "event",
    {
      name: "food_search_result_selected",
      data: expect.objectContaining({ food: "apples" }),
    },
  ]);
});

test("renders catalogue SVG artwork for common and niche foods", async ({ page }) => {
  await openComparison(page);
  await openFoodChooser(page);
  await page.getByRole("searchbox", { name: "Search foods" }).fill("broccoli");
  await expect(page.locator('.food-option:visible .food-visual[data-artwork="catalogue"] img[src$="broccoli.svg"]').first()).toBeVisible();
  await expect(page.locator(".food-option:visible .food-visual").first()).toHaveText("");

  await page.getByRole("searchbox", { name: "Search foods" }).fill("turmeric");
  await expect(page.locator('.food-option:visible .food-visual[data-artwork="catalogue"] img[src$="turmeric.svg"]').first()).toBeVisible();
  await expect(page.locator(".food-option:visible .food-visual").first()).toHaveText("");
});

test("changes the comparison measure and URL state", async ({ page }) => {
  await openComparison(page);
  const measure = page.locator('.metric-tabs button[data-metric="multiplePct"]');
  await measure.click();

  await expect(measure).toHaveAttribute("aria-pressed", "true");
  await expect(page).toHaveURL(/metric=multiplePct/);
  await expect(page.locator("#chart-title")).toBeVisible();
});

test("preserves campaign attribution while the shopper builds a comparison", async ({ page }) => {
  await page.goto("/compare?utm_source=founder_network&utm_medium=direct&utm_campaign=founding_users_oct_2026");
  await openFoodChooser(page);
  await page.getByRole("button", { name: "Clear" }).click();
  await page.getByRole("searchbox", { name: "Search foods" }).fill("apples");
  await page.locator(".food-option").filter({ has: page.getByText("Apples", { exact: true }) }).click();

  await expect(page).toHaveURL(/utm_source=founder_network/);
  await expect(page).toHaveURL(/utm_medium=direct/);
  await expect(page).toHaveURL(/utm_campaign=founding_users_oct_2026/);
  await expect(page).toHaveURL(/foods=apples/);
});

test("saves an individual food", async ({ page }) => {
  await openComparison(page);
  await openFoodChooser(page);
  await page.getByRole("searchbox", { name: "Search foods" }).fill("apples");
  const save = page.getByRole("button", { name: "Save Apples to My list", exact: true });
  await expect(save).toBeVisible();
  await save.click();

  await expect(page.getByRole("button", { name: "Remove Apples from My list", exact: true })).toHaveAttribute("aria-pressed", "true");
});

test("focuses a food and opens its residue details", async ({ page }) => {
  await openComparison(page);
  await page.locator('.chart-row[aria-label^="Broccoli:"]').click();
  const details = page.getByRole("link", { name: /^View residue details for Broccoli/ });
  await expect(details).toBeVisible();
  await details.click();

  await expect(page).toHaveURL(/#details$/);
  await expect(page.locator("#residue-title")).toContainText("broccoli");
});

test("shares the current comparison", async ({ page }) => {
  await openComparison(page);
  await page.evaluate(() => {
    Object.defineProperty(navigator, "canShare", { configurable: true, value: () => true });
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: async (data: ShareData) => {
        document.documentElement.dataset.sharedUrl = data.url ?? "";
      },
    });
  });

  await page.getByRole("button", { name: "Share comparison" }).click();

  await expect(page.getByRole("status")).toContainText("Comparison shared.");
  await expect(page.locator("html")).toHaveAttribute("data-shared-url", /foods=grapes/);
});

test("presents Plus as a waitlist without selling an unfinished subscription", async ({ page }) => {
  await page.goto("/pro");

  await expect(page.getByRole("heading", { name: "Join the Plus waitlist." })).toBeVisible();
  await expect(page.getByRole("button", { name: "Join waitlist" })).toBeVisible();
  await expect(page.getByText(/Plus is not for sale/i)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Available free today" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Possibilities, not promises" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Commercial boundary" })).toHaveCount(0);
  await expect(page.getByText(/£3|£24/)).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Choose £/ })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Why Plus is worth paying for" })).toHaveCount(0);
  await expect(page.getByText(/alerts when official evidence changes|comparisons by origin or retailer|organic-budget tools/i)).toHaveCount(0);
});

test("keeps checkout unavailable during the free public launch", async ({ page }) => {
  const response = await page.request.post("/api/checkout", { data: { plan: "annual" } });

  expect(response.status()).toBe(503);
  await expect(response.json()).resolves.toEqual({
    error: "Plus is not on sale while Residue Lens validates which recurring tools people value.",
  });
});

test("keeps private beta and unfinished tools out of the public discovery path", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Private beta" })).toHaveCount(0);

  const sitemap = await page.request.get("/sitemap.xml");
  expect(await sitemap.text()).not.toMatch(/\/(beta|planner|account|pro|my-list)<\/loc>/);
  expect(await sitemap.text()).not.toMatch(/\/guides\/(organic-priorities|understanding-mrls|washing-and-peeling)<\/loc>/);
});

test("keeps private and browser-state pages out of search results", async ({ page }) => {
  for (const path of ["/account", "/my-list", "/planner"]) {
    await page.goto(path);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  }
});

test("retires private beta and update-feed experiments", async ({ page }) => {
  await page.goto("/beta");
  await expect(page).toHaveURL(/\/feedback$/);
  await expect(page.getByRole("heading", { name: /questions, corrections and useful feedback/i })).toBeVisible();

  const feed = await page.request.get("/feed.xml");
  expect(feed.status()).toBe(404);

  await page.goto("/my-list");
  await expect(page.getByText("Data updates", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "RSS feed" })).toHaveCount(0);
});

test("does not advertise browser installation", async ({ page }) => {
  await page.goto("/my-list");
  await expect(page.getByRole("button", { name: /switch to .* theme/i })).toBeVisible();
  await expect(page.locator('link[rel="manifest"]')).toHaveCount(0);
  await expect(page.getByRole("complementary", { name: "Install Residue Lens web app" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Install web app" })).toHaveCount(0);

  const manifest = await page.request.get("/manifest.webmanifest");
  expect(manifest.status()).toBe(404);
});

test("keeps the unlisted planner available as a free research preview", async ({ page }) => {
  await page.goto("/planner");

  await expect(page.getByRole("heading", { name: "Organic budget planner" })).toBeVisible();
  await expect(page.getByText("Research preview", { exact: true })).toBeVisible();
  await expect(page.getByText(/activate Plus|Plus feature/i)).toHaveCount(0);
});

test("explains list storage honestly and sends empty states to the comparison", async ({ page }) => {
  await page.goto("/my-list");
  await expect(page.getByText(/remain on this device unless you explicitly upload them from Account options/i)).toBeVisible();
  await expect(page.getByRole("link", { name: "Add foods to this list" })).toHaveAttribute("href", "/compare");

  await page.goto("/planner");
  await expect(page.getByRole("link", { name: "Add comparable foods" })).toHaveAttribute("href", "/compare");
});

test("makes the complete available food evidence free", async ({ page }) => {
  await page.goto("/foods/us-apples");

  await expect(page.locator(".residue-result-row")).toHaveCount(20);
  await expect(page.locator(".food-history tbody tr")).toHaveCount(17);
  await expect(page.locator(".plus-lock, .plus-inline")).toHaveCount(0);
  await expect(page.getByText(/Plus access|included free|available with Plus/)).toHaveCount(0);
});

test("keeps all guidance on one expandable page", async ({ page }) => {
  await page.goto("/guides");
  await expect(page.locator(".guide-accordion details")).toHaveCount(3);

  const organicGuide = page.locator(".guide-accordion details").filter({ hasText: "Where could buying organic make the biggest difference?" });
  await organicGuide.locator("summary").press("Enter");
  await expect(organicGuide).toHaveAttribute("open", "");
  await expect(page.getByText("percentage-point gap", { exact: false })).toHaveCount(0);
  await expect(page.getByText("publishable comparison", { exact: false })).toHaveCount(0);
  await expect(page.getByText("Standard-grown", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Organic", { exact: true }).first()).toBeVisible();
  await expect(page.locator(".organic-comparison-card .food-visual").first()).toBeVisible();

  const mrlGuide = page.locator(".guide-accordion details").filter({ hasText: "What does above an MRL mean?" });
  await mrlGuide.locator("summary").press("Enter");
  await expect(mrlGuide.getByText(/legal limit, not a toxicity score/i)).toBeVisible();

  const washingGuide = page.locator(".guide-accordion details").filter({ hasText: "Does washing remove pesticide residues?" });
  await washingGuide.locator("summary").press("Enter");
  await expect(washingGuide.getByText(/sensible hygiene, not a residue guarantee/i)).toBeVisible();
});

test("redirects old guide links to the consolidated guide", async ({ page }) => {
  for (const path of ["/guides/organic-priorities", "/guides/understanding-mrls", "/guides/washing-and-peeling"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/guides$/);
  }
});

test("food detail uses priority labels and direct comparison links", async ({ page }) => {
  await page.goto("/foods/lemons");
  await expect(page.getByText(/organic-buying priority/i).first()).toBeVisible();
  await expect(page.getByText(/standard-grown.*called conventional in the source data/i).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /compare with other foods/i })).toHaveAttribute("href", /\/compare\?/);
  await expect(page.locator(".food-hero .food-visual")).toBeVisible();
});

test("integrates reviewed health evidence without turning detection into a harm claim", async ({ page }) => {
  await page.goto("/foods/lemons");
  await expect(page.locator(".residue-health-list")).toHaveCount(0);
  await expect(page.getByText(/What regulators assessed/).first()).toBeVisible();
  const values = page.getByText("Reference values", { exact: true }).first();
  await values.press("Enter");
  await expect(page.getByText(/Long-term reference/).first()).toBeVisible();
  await expect(page.getByText(/Detection does not establish harm/).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /WHO\/FAO JMPR/ }).first()).toHaveAttribute("href", /apps\.who\.int/);
});

test("explains functional residue types once beside the results", async ({ page }) => {
  await page.goto("/foods/lemons");
  const guide = page.getByText("What do these types mean?", { exact: true });
  await guide.press("Enter");
  await expect(page.getByText(/controls fungal diseases/i)).toBeVisible();
  await expect(page.getByText(/not a toxicity ranking/i)).toBeVisible();
});

test("shows a compact example and remembers when the food picker is expanded", async ({ page }) => {
  await openComparison(page);
  const metrics = page.locator(".metric-tabs button");
  await expect(metrics).toHaveCount(6);
  await expect(page.locator(".explorer-grid")).toHaveClass(/picker-collapsed/);
  await expect(page.getByRole("button", { name: /Choose foods \(3\)/ })).toBeVisible();
  await expect(page.locator('.chart-row[aria-label^="Grapes:"]')).toBeVisible();
  await page.getByRole("button", { name: /Choose foods \(3\)/ }).click();
  await expect(page.getByRole("searchbox", { name: "Search foods" })).toBeVisible();
  await page.reload();
  await expect(page.locator(".explorer-grid")).not.toHaveClass(/picker-collapsed/);
  await expect(page.getByRole("searchbox", { name: "Search foods" })).toBeVisible();
});

test("account and About keep only the useful destinations", async ({ page }) => {
  await page.goto("/account");
  await expect(page.getByRole("heading", { name: "Free account" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Residue Lens Plus" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Join the Plus waitlist" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Manage My list" })).toHaveAttribute("href", "/my-list");
  await page.goto("/about");
  await expect(page.getByRole("link", { name: /madebyhakim\.com/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /GitHub/ })).toHaveCount(0);
});

for (const [path, active] of [
  ["/compare", "Compare"],
  ["/my-list", "My list"],
  ["/guides", "Guides"],
  ["/methodology", "Methodology"],
] as const) {
  test(`${path} shows the complete navigation`, async ({ page }) => {
    await page.goto(path);
    const navigation = page.getByRole("navigation", { name: "Main navigation" });
    for (const label of ["Compare", "My list", "Guides", "Methodology"]) {
      await expect(navigation.getByRole("link", { name: label, exact: true })).toBeVisible();
    }
    await expect(navigation.getByRole("link", { name: "Plus", exact: true })).toHaveCount(0);
    await expect(navigation.getByRole("link", { name: active, exact: true })).toHaveAttribute("aria-current", "page");
  });
}

test("Plus waitlist remains available without advertising itself in the footer", async ({ page }) => {
  await page.goto("/pro");
  const navigation = page.getByRole("navigation", { name: "Main navigation" });
  await expect(navigation.getByRole("link", { name: "Plus", exact: true })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Join the Plus waitlist." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Plus waitlist", exact: true })).toHaveCount(0);
});

test("offers optional independent support without handling payments", async ({ page }) => {
  await page.goto("/support");
  await expect(page.getByRole("heading", { level: 1, name: /help keep residue lens useful and independent/i })).toBeVisible();
  const supportLink = page.getByRole("link", { name: "Buy me a coffee ↗" });
  await expect(supportLink).toHaveAttribute("href", "https://buymeacoffee.com/madebyhakim");
  await expect(supportLink).toHaveAttribute("target", "_blank");
  expect(await supportLink.evaluate((element) => getComputedStyle(element).backgroundColor)).not.toBe("rgba(0, 0, 0, 0)");
  await expect(page.getByRole("link", { name: "Support Residue Lens", exact: true })).toHaveAttribute("href", "/support");
});

test("support prompt waits before appearing and respects dismissal", async ({ page }) => {
  await page.clock.install();
  await page.goto("/");
  const themeToggle = page.locator(".theme-toggle");
  const initialThemeLabel = await themeToggle.getAttribute("aria-label");
  await themeToggle.click();
  await expect(themeToggle).not.toHaveAttribute("aria-label", initialThemeLabel ?? "");
  await themeToggle.click();
  await expect(page.getByLabel("Support Residue Lens prompt")).toHaveCount(0);
  await page.clock.runFor(20_000);
  await expect(page.getByLabel("Support Residue Lens prompt")).toHaveCount(0);
  await page.clock.runFor(10_000);
  await expect(page.getByLabel("Support Residue Lens prompt")).toBeVisible();
  await page.getByRole("button", { name: "Not now" }).click();
  await expect(page.getByLabel("Support Residue Lens prompt")).toHaveCount(0);
  const dismissedAt = await page.evaluate(() => window.localStorage.getItem("residue-lens-support-prompt-dismissed"));
  expect(Number(dismissedAt)).toBeGreaterThan(0);
});
