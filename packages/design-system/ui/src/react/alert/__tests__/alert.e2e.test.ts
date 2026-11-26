/**
 * Stackra file contract:
 * Purpose: the package e2e proof of `Alert`: in a real browser the success alert is announced politely and the danger
 *          alert assertively, with no console error (the shared fixture fails the test on one), and under the
 *          `chromium-ar` project the document is right to left.
 * Boundary: test only; runs in the Playwright runner through `.stackra/playwright.e2e.config.ts`, never under vitest.
 * Runtime: node (Playwright)
 * Governing contract: ADR 0022 (amendment of 2026-11-09: package e2e); ADR 0302.
 */
import { expect, test } from "@stackra/testing/e2e";

test("announces each alert by its tone, in the document's direction", async ({ page }) => {
  await page.goto("/alert");
  await expect(page.getByText("Saved")).toBeVisible();
  await expect(page.locator('[data-slot="alert-root"]').first()).toHaveAttribute(
    "aria-live",
    "polite",
  );
  await expect(page.locator('[data-slot="alert-root"]').last()).toHaveAttribute(
    "aria-live",
    "assertive",
  );
  const rtl = test.info().project.name === "chromium-ar";
  await expect(page.locator("html")).toHaveAttribute("dir", rtl ? "rtl" : "ltr");
});
