/**
 * Stackra file contract:
 * Purpose: the TrendChip page in Chromium: every chip names its direction in words, up, down and neutral each appear in
 *          every size and every variant, the three sizes grow in height, and the prefix and suffix are drawn.
 * Boundary: the production build under `vite preview`; Chromium only. The page has no overlay or state to open, so axe
 *          runs on it in all four scheme and direction combinations by `playground.e2e.test.ts`.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 5); ADR 0182 (test tiers); ADR 0022 (test placement).
 */
// @covers sta-403:FR-013
import { expect, test } from "@playwright/test";

import { visit } from "../support/visit.function";

const PATH = "/pro-trend-chip";
const WORDS = { up: "Trending up", down: "Trending down", neutral: "No change" } as const;

test("every chip names its direction in words", async ({ page }) => {
  await visit(page, PATH, "light");
  for (const [trend, words] of Object.entries(WORDS)) {
    const chips = page.locator(`[data-trend="${trend}"]`);
    expect(await chips.count(), trend).toBeGreaterThan(0);
    for (const chip of await chips.all()) await expect(chip).toContainText(words);
  }
});

test("draws each direction in every size and every variant", async ({ page }) => {
  await visit(page, PATH, "light");
  for (const style of ["sm", "md", "lg", "soft", "primary", "secondary", "tertiary"])
    for (const trend of Object.keys(WORDS))
      await expect(
        page.locator(`.chip--${style}[data-trend="${trend}"]`).first(),
        `${trend} as ${style}`,
      ).toBeVisible();
});

test("grows the chip from the small size to the large", async ({ page }) => {
  await visit(page, PATH, "light");
  const height = async (size: string) =>
    (await page.locator(`.chip--${size}[data-trend="up"]`).first().boundingBox())?.height ?? 0;
  const [small, medium, large] = [await height("sm"), await height("md"), await height("lg")];
  expect(small).toBeGreaterThan(0);
  expect(medium).toBeGreaterThan(small);
  expect(large).toBeGreaterThan(medium);
});

test("draws the prefix and the suffix", async ({ page }) => {
  await visit(page, PATH, "light");
  await expect(page.getByText("+$", { exact: true })).toBeVisible();
  await expect(page.getByText("vs last month")).toBeVisible();
});
