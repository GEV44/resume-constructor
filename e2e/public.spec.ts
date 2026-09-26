import { test, expect } from "@playwright/test";

test.describe("public pages", () => {
  test("landing page presents the product and links to the free checker", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/AI Resume Builder/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Build Resumes");
    await page.getByRole("link", { name: /Free ATS Check/i }).first().click();
    await expect(page).toHaveURL(/\/ats-checker$/);
  });

  test("protected routes redirect to login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("link", { name: /Forgot password/i })).toBeVisible();
  });

  test("unknown routes show a 404 page", async ({ page }) => {
    await page.goto("/definitely-not-a-page");
    await expect(page.getByRole("heading", { name: /Page not found/i })).toBeVisible();
  });
});

test.describe("free ATS checker", () => {
  test("scores the sample resume entirely in the browser", async ({ page }) => {
    const apiCalls: string[] = [];
    page.on("request", (r) => { if (/supabase\.co|functions\/v1/.test(r.url())) apiCalls.push(r.url()); });

    await page.goto("/ats-checker");
    await page.getByRole("button", { name: /Use a sample/i }).click();
    await page.getByLabel(/Target role/i).selectOption("frontend-engineer");
    await page.getByLabel(/Job description/i).fill("We use React, TypeScript, GraphQL and Playwright. GraphQL experience required.");
    await page.getByRole("button", { name: /Check My Resume/i }).click();

    const ring = page.getByRole("img", { name: /ATS score \d+ out of 100/ });
    await expect(ring).toBeVisible();
    await expect(page.getByText(/Job keywords missing/)).toBeVisible();
    await expect(page.locator("#results")).toContainText("GraphQL");
    expect(apiCalls, "the checker must not send resume data anywhere").toEqual([]);
  });

  test("gives the same score for the same input", async ({ page }) => {
    await page.goto("/ats-checker");
    await page.getByRole("button", { name: /Use a sample/i }).click();
    await page.getByRole("button", { name: /Check My Resume/i }).click();
    const first = await page.getByRole("img", { name: /ATS score/ }).getAttribute("aria-label");
    await page.getByRole("button", { name: /Recheck/i }).click();
    await page.getByRole("button", { name: /Check My Resume/i }).click();
    await expect(page.getByRole("img", { name: /ATS score/ })).toHaveAttribute("aria-label", first!);
  });
});

test("README screenshots of public pages", async ({ page }, info) => {
  test.skip(!process.env.SCREENSHOTS || info.project.name !== "desktop");
  await page.goto("/");
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "docs/screenshots/landing.png" });
  await page.goto("/ats-checker");
  await page.getByRole("button", { name: /Use a sample/i }).click();
  await page.getByLabel(/Job description/i).fill("Senior Frontend Engineer. React, TypeScript, GraphQL, Playwright, accessibility and performance.");
  await page.getByRole("button", { name: /Check My Resume/i }).click();
  await page.waitForTimeout(1500);
  await page.locator("#results").screenshot({ path: "docs/screenshots/ats-checker.png" });
});
