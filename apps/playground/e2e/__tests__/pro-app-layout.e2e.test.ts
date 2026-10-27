/**
 * Stackra file contract:
 * Purpose: the AppLayout page in Chromium: the shell sits inside its frame with the page's only main landmark, the
 *          aside opens and closes from its trigger, the sidebar collapses from the top bar, on a narrow viewport the
 *          menu button opens the navigation in a sheet and choosing an item closes it, and the page passes axe with
 *          the aside closed and the sidebar collapsed, and with the sheet open, in light and dark.
 * Boundary: the production build under `vite preview`; Chromium only. The closed, default state is covered in all four
 *          scheme and direction combinations by `playground.e2e.test.ts`. HeroUI Pro hides the aside trigger below
 *          1024px and the menu button above 768px, so the suites use a wide and a narrow viewport.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 5); ADR 0182 (test tiers); ADR 0022 (test placement).
 */
// @covers sta-403:FR-013
import { expect, test, type Page } from "@playwright/test";

import { SCHEMES } from "../support/schemes.constant";
import { visit } from "../support/visit.function";
import { expectNoAxeFindings } from "../support/expect-no-axe-findings.function";

const PATH = "/pro-app-layout";
const NARROW = { width: 600, height: 900 };

const sidebar = (page: Page) => page.getByRole("complementary", { name: "Primary navigation" });
const sidebarToggle = (page: Page) =>
  page.getByRole("button", { name: "Collapse or expand the sidebar" });
const asideTrigger = (page: Page) =>
  page.getByRole("button", { name: "Show or hide the details panel" });
const aside = (page: Page) => page.locator('[data-slot="app-layout-aside"]');
const menuToggle = (page: Page) => page.getByRole("button", { name: "Open navigation" });

test("sits inside its frame and draws the page's only main landmark", async ({ page }) => {
  await visit(page, PATH, "light");
  await expect(page.getByRole("main")).toHaveCount(1);
  const frame = await page.locator(".demo-frame").boundingBox();
  const main = await page.getByRole("main").boundingBox();
  expect(frame && main).toBeTruthy();
  expect((main?.y ?? 0) + (main?.height ?? 0)).toBeLessThanOrEqual(
    (frame?.y ?? 0) + (frame?.height ?? 0) + 1,
  );
  expect(frame?.height).toBeLessThan(600);
});

test("opens and closes the aside from its trigger", async ({ page }) => {
  await visit(page, PATH, "light");
  await expect(asideTrigger(page)).toHaveAttribute("aria-expanded", "true");
  await expect(aside(page)).toHaveAttribute("data-state", "open");

  await asideTrigger(page).click();
  await expect(asideTrigger(page)).toHaveAttribute("aria-expanded", "false");
  await expect(aside(page)).toHaveAttribute("data-state", "closed");

  await asideTrigger(page).click();
  await expect(aside(page)).toHaveAttribute("data-state", "open");
});

test("collapses the sidebar from the top bar and moves the current page from it", async ({
  page,
}) => {
  await visit(page, PATH, "light");
  await expect(sidebar(page)).toHaveAttribute("data-state", "expanded");
  await sidebarToggle(page).click();
  await expect(sidebar(page)).toHaveAttribute("data-state", "collapsed");
  await sidebarToggle(page).click();
  await expect(sidebar(page)).toHaveAttribute("data-state", "expanded");

  await page.getByRole("row", { name: "Customers", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("Current page: Customers");
});

test("on a narrow viewport the menu button opens the navigation in a sheet, and an item closes it", async ({
  page,
}) => {
  await page.setViewportSize(NARROW);
  await visit(page, PATH, "light");
  await expect(sidebar(page)).toBeHidden();
  await expect(asideTrigger(page)).toBeHidden();

  await menuToggle(page).click();
  const sheet = page.getByRole("dialog");
  await expect(sheet).toBeVisible();
  await expect(sheet.getByRole("treegrid", { name: "Workspace navigation" })).toBeVisible();

  await sheet.getByRole("row", { name: "Orders", exact: true }).click();
  await expect(sheet).toBeHidden();
  await expect(page.getByRole("status")).toHaveText("Current page: Orders");
});

for (const scheme of SCHEMES) {
  test(`passes axe with the aside closed and the sidebar collapsed, in ${scheme}`, async ({
    page,
  }) => {
    await visit(page, PATH, scheme);
    await asideTrigger(page).click();
    await expect(aside(page)).toHaveAttribute("data-state", "closed");
    await sidebarToggle(page).click();
    await expect(sidebar(page)).toHaveAttribute("data-state", "collapsed");
    await expectNoAxeFindings(page);
  });

  test(`passes axe with the navigation sheet open on a narrow viewport, in ${scheme}`, async ({
    page,
  }) => {
    await page.setViewportSize(NARROW);
    await visit(page, PATH, scheme);
    await menuToggle(page).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expectNoAxeFindings(page);
  });
}
