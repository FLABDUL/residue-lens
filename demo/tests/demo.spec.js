import { test, expect } from "@playwright/test"

test("frozen comparison, cohort, shortlist and no backend POST", async ({ page }) => {
  const posts = []
  page.on("request", r => { if (r.method() !== "GET") posts.push(r.url()) })
  const errors = []
  page.on("pageerror", e => errors.push(e.message))
  await page.goto("./")
  await expect(page.getByRole("heading", { name: "Choose foods. Change the question." })).toBeVisible()
  await expect(page.getByText("Interactive archive")).toBeVisible()
  await page.getByLabel("Growing method").selectOption("organic")
  await expect(page.getByRole("region", { name: "Comparison results" }))
    .toContainText("No samples in this cohort")
  await page.getByRole("button", { name: "Save to shortlist" }).first().click()
  await expect(page.getByRole("complementary", { name: "Demo shortlist" })).toContainText("Grapes")
  await page.getByRole("button", { name: "Above MRL", exact: true }).click()
  await expect(page.getByRole("heading", { name: "Above MRL", exact: true })).toBeVisible()
  for (const item of await page.getByRole("checkbox").all()) await item.uncheck()
  await expect(page.getByText("Choose a food above to see its monitoring results.")).toBeVisible()
  await page.reload()
  await expect(page.getByRole("complementary", { name: "Demo shortlist" }))
    .toContainText("Save a food from the comparison")
  expect(posts).toEqual([])
  expect(errors).toEqual([])
})
test("responsive mobile layout and evidence links", async ({page}) => {
  await page.goto("./")
  await expect(page.getByRole("link", {name: "Case study"})).toHaveAttribute("href", /madebyhakim/)
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({width,height:900})
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }
  const first=page.locator(".residue-demo__choices img").first()
  await expect(first).toHaveJSProperty("complete", true)
  expect(await first.evaluate(img => img.naturalWidth)).toBeGreaterThan(0)
})
