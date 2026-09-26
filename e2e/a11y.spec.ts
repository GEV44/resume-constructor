import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { useMockBackend, LATEST_ANALYSIS_ID } from "./mock-backend";

// WCAG 2.2 A/AA checks on every major screen. Serious and critical violations fail the build.
async function expectAccessible(page: Page) {
  await page.waitForTimeout(800); // let entrance animations finish so contrast is measured on final colors
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  const blocking = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(blocking.map((v) => `${v.id}: ${v.help} (${v.nodes.length}) → ${v.nodes.slice(0, 3).map((n) => n.target.join(" ") + " " + n.html.slice(0, 160) + " " + (n.failureSummary ?? "").slice(0, 200)).join(" | ")}`), page.url()).toEqual([]);
}

test.describe("accessibility", () => {

  for (const path of ["/", "/ats-checker", "/login", "/signup", "/forgot-password", "/missing-page"]) {
    test(`public ${path}`, async ({ page }) => {
      await page.goto(path);
      await expectAccessible(page);
    });
  }

  test("free checker results", async ({ page }) => {
    await page.goto("/ats-checker");
    await page.getByRole("button", { name: /Use a sample/i }).click();
    await page.getByRole("button", { name: /Check My Resume/i }).click();
    await expect(page.locator("#results")).toBeVisible();
    await expectAccessible(page);
  });

  test.describe("signed in", () => {
    test.beforeEach(async ({ page }) => useMockBackend(page));
    for (const path of ["/dashboard", "/dashboard/upload", `/dashboard/analysis/${LATEST_ANALYSIS_ID}`, "/dashboard/analyses", "/dashboard/profile"]) {
      test(path, async ({ page }) => {
        await page.goto(path);
        await expect(page.locator("#main-content")).toBeVisible();
        await expectAccessible(page);
      });
    }
    test("/dashboard/optimizations (detail open)", async ({ page }) => {
      await page.goto("/dashboard/optimizations");
      await page.getByRole("button", { name: /Frontend Engineer/ }).first().click();
      await expect(page.getByRole("tablist")).toBeVisible();
      await expectAccessible(page);
    });
  });
});
