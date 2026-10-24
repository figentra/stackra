/**
 * Stackra file contract:
 * Purpose: the Kpi page in Chromium: four cards show their title, formatted value and a trend that names its direction,
 *          each trend has the direction's colour role, the storage card has a progress bar at its value, each card has a
 *          named actions button reachable by keyboard, and every `dt` and `dd` sits in a `dl` with no box of its own.
 * Boundary: the production build under `vite preview`; Chromium only. The page has no overlay or state to open, so axe
 *          runs on it in all four scheme and direction combinations by `playground.e2e.test.ts`.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 5); ADR 0182 (test tiers); ADR 0022 (test placement).
 */
// @covers sta-403:FR-013
import { expect, test } from "@playwright/test";

import { visit } from "../support/pro-page";

const PATH = "/pro-kpi";

test("shows each metric's title and formatted value", async ({ page }) => {
  await visit(page, PATH, "light");
  await expect(page.locator('[data-slot="kpi-title"]')).toHaveText([
    "Revenue",
    "Active users",
    "Refund rate",
    "Storage used",
  ]);
  await expect(page.locator('[data-slot="kpi-value"]')).toHaveText([
    "$128,450",
    "3,482",
    "2.1%",
    "72%",
  ]);
});

test("names the direction of each trend, beside its change", async ({ page }) => {
  await visit(page, PATH, "light");
  const trends = page.locator("[data-trend]");
  await expect(trends).toHaveCount(4);
  await expect(trends.nth(0)).toHaveAttribute("data-trend", "up");
  await expect(trends.nth(0)).toContainText("+8.2%");
  await expect(trends.nth(0)).toContainText("Trending up");
  await expect(trends.nth(2)).toHaveAttribute("data-trend", "down");
  await expect(trends.nth(2)).toContainText("-0.4%");
  await expect(trends.nth(2)).toContainText("Trending down");
  await expect(trends.nth(3)).toHaveAttribute("data-trend", "neutral");
  await expect(trends.nth(3)).toContainText("No change");
});

test("draws a progress bar on the storage card at its value", async ({ page }) => {
  await visit(page, PATH, "light");
  const bar = page.getByRole("progressbar");
  await expect(bar).toHaveCount(1);
  await expect(bar).toHaveAttribute("aria-valuenow", "72");
});

test("gives each card a named actions button that the keyboard reaches", async ({ page }) => {
  await visit(page, PATH, "light");
  const actions = page.getByRole("button", { name: /^Actions for / });
  await expect(actions).toHaveCount(4);
  await actions.first().focus();
  await expect(actions.first()).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(actions.nth(1)).toBeFocused();
});

test("keeps every dt and dd inside a dl that adds no box to the layout", async ({ page }) => {
  await visit(page, PATH, "light");
  const parents = await page.evaluate(() =>
    [...document.querySelectorAll("dt, dd")].map((term) => ({
      tag: term.parentElement?.tagName,
      display: term.parentElement ? getComputedStyle(term.parentElement).display : null,
    })),
  );
  expect(parents.length).toBeGreaterThan(0);
  for (const parent of parents) expect(parent).toEqual({ tag: "DL", display: "contents" });
});
