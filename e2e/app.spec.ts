import { test, expect, type Page } from "@playwright/test";
import { useMockBackend, LATEST_ANALYSIS_ID } from "./mock-backend";

// `SCREENSHOTS=1 npx playwright test --project=desktop` refreshes the README images.
const shoot = async (page: Page, name: string) => {
  if (!process.env.SCREENSHOTS || test.info().project.name !== "desktop") return;
  await page.waitForTimeout(1200); // let entrance animations settle
  await page.screenshot({ path: `docs/screenshots/${name}.png` });
};

test.describe("signed-in app (mocked backend)", () => {
  test.beforeEach(async ({ page }) => {
    await useMockBackend(page);
  });

  test("dashboard shows stats, next step and score trend", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: /Your Resume Dashboard/i })).toBeVisible();
    await expect(page.getByText("Welcome back, Alex Morgan", { exact: false })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Score Progress/i })).toBeVisible();
    await expect(page.getByText("84 / 72")).toBeVisible();
    await shoot(page, "dashboard");
  });

  test("analysis page shows saved findings and the job-description match", async ({ page }) => {
    await page.goto(`/dashboard/analysis/${LATEST_ANALYSIS_ID}`);
    await expect(page.getByRole("heading", { name: /Job Description Match/i })).toBeVisible();
    await expect(page.getByText(/Specific Problems Found \(3\)/)).toBeVisible();
    await page.getByRole("button", { name: /Performance work has no measurable result/ }).click();
    await expect(page.getByText("SUGGESTED FIX")).toBeVisible();
    await shoot(page, "analysis");
  });

  test("optimization editor re-scores live and flags placeholders", async ({ page }) => {
    await page.goto("/dashboard/optimizations", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /Frontend Engineer/ }).first().click();
    await expect(page.getByText(/placeholders? to fill in/)).toBeVisible();
    await shoot(page, "optimization-changes");

    await page.getByRole("tab", { name: "Export" }).click();
    await expect(page.getByRole("button", { name: /ATS PDF/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Word \(\.docx\)/ })).toBeVisible();
    await shoot(page, "export");

    await page.getByRole("tab", { name: "Preview" }).click();
    await expect(page.locator(".resume")).toContainText("Alex Morgan");
    await page.getByLabel("Template").selectOption("modern");
    await shoot(page, "preview");

    // Editing marks the draft dirty, switches to the live score and clears a placeholder.
    await page.getByRole("tab", { name: /^Edit/ }).click();
    const bullets = page.getByLabel(/Senior Frontend Engineer/);
    await bullets.fill((await bullets.inputValue()).replace("[X%]", "35%"));
    await expect(page.getByRole("tab", { name: "Edit •" })).toBeVisible();
    await expect(page.getByText("Current (unsaved)")).toBeVisible();
    await expect(page.getByText(/2 \[X\] placeholders/)).toBeVisible();
  });

  test("the ATS PDF export downloads a real text PDF", async ({ page }) => {
    await page.goto("/dashboard/optimizations");
    await page.getByRole("button", { name: /Frontend Engineer/ }).first().click();
    await page.getByRole("tab", { name: "Export" }).click();
    page.once("dialog", (d) => d.accept()); // placeholder warning
    const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: /ATS PDF/ }).click()]);
    expect(download.suggestedFilename()).toMatch(/alex-morgan-frontend-engineer\.pdf$/);
    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];
    for await (const c of stream) chunks.push(c as Buffer);
    const pdf = Buffer.concat(chunks).toString("latin1");
    expect(pdf.startsWith("%PDF")).toBe(true);
    expect(pdf).toContain("Alex Morgan");
  });
});
