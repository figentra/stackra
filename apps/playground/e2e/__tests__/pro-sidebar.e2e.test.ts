/**
 * Stackra file contract:
 * Purpose: the Sidebar page in Chromium: the sidebar sits inside its frame, collapses to icons and expands again from
 *          its trigger and from Ctrl with B, hides its labels while collapsed, keeps a working navigation (an item
 *          becomes the current page, a submenu collapses from the keyboard), and passes axe expanded and collapsed, in
 *          light and dark.
 * Boundary: the production build under `vite preview`; Chromium only. The closed, default state is covered in all four
 *          scheme and direction combinations by `playground.e2e.test.ts`. The rail is a pointer-only strip (HeroUI Pro
 *          takes it out of the tab order), so it is not exercised here.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 5); ADR 0182 (test tiers); ADR 0022 (test placement).
 */
// @covers sta-403:FR-013
import { expect, test, type Page } from "@playwright/test";

import { SCHEMES } from "../support/schemes.constant";
import { visit } from "../support/visit.function";
import { expectNoAxeFindings } from "../support/expect-no-axe-findings.function";

const PATH = "/pro-sidebar";

const sidebar = (page: Page) => page.getByRole("complementary", { name: "Primary navigation" });
const toggle = (page: Page) => page.getByRole("button", { name: "Collapse or expand the sidebar" });
const item = (page: Page, name: string) => page.getByRole("row", { name, exact: true });

test("sits inside its frame, not over the viewport", async ({ page }) => {
  await visit(page, PATH, "light");
  const frame = await page.locator(".demo-frame").boundingBox();
  const aside = await sidebar(page).boundingBox();
  expect(frame && aside).toBeTruthy();
  expect(aside?.y).toBeGreaterThanOrEqual((frame?.y ?? 0) - 1);
  expect((aside?.y ?? 0) + (aside?.height ?? 0)).toBeLessThanOrEqual(
    (frame?.y ?? 0) + (frame?.height ?? 0) + 1,
  );
});

test("collapses to icons and expands again from its trigger", async ({ page }) => {
  await visit(page, PATH, "light");
  await expect(sidebar(page)).toHaveAttribute("data-state", "expanded");
  await expect(sidebar(page).getByText("Acme")).toBeVisible();

  await toggle(page).click();
  await expect(sidebar(page)).toHaveAttribute("data-state", "collapsed");
  await expect(sidebar(page).getByText("Acme")).toBeHidden();
  // Collapsed, an item keeps its name for assistive technology, though its label is not drawn.
  await expect(item(page, "Orders")).toBeVisible();

  await toggle(page).click();
  await expect(sidebar(page)).toHaveAttribute("data-state", "expanded");
  await expect(sidebar(page).getByText("Acme")).toBeVisible();
});

test("toggles from the keyboard with Ctrl and B", async ({ page }) => {
  await visit(page, PATH, "light");
  await page.keyboard.press("Control+b");
  await expect(sidebar(page)).toHaveAttribute("data-state", "collapsed");
  await page.keyboard.press("Control+b");
  await expect(sidebar(page)).toHaveAttribute("data-state", "expanded");
});

test("keeps a working navigation: an item becomes the current page", async ({ page }) => {
  await visit(page, PATH, "light");
  const status = page.getByRole("status");
  await expect(status).toHaveText("Current page: Dashboard");
  await expect(item(page, "Dashboard")).toHaveAttribute("data-current", "true");

  await item(page, "Orders").click();
  await expect(status).toHaveText("Current page: Orders");
  await expect(item(page, "Orders")).toHaveAttribute("data-current", "true");
  await expect(item(page, "Dashboard")).not.toHaveAttribute("data-current", "true");

  await item(page, "Overview").click();
  await expect(status).toHaveText("Current page: Overview");

  await item(page, "Settings").click();
  await expect(status).toHaveText("Current page: Settings");
});

test("collapses and expands its submenu from the keyboard", async ({ page }) => {
  await visit(page, PATH, "light");
  await expect(item(page, "Overview")).toBeVisible();
  await item(page, "Reports").focus();
  await page.keyboard.press("ArrowLeft");
  await expect(item(page, "Overview")).toBeHidden();
  await page.keyboard.press("ArrowRight");
  await expect(item(page, "Overview")).toBeVisible();
});

for (const scheme of SCHEMES)
  test(`passes axe expanded with its submenu open, and collapsed, in ${scheme}`, async ({
    page,
  }) => {
    await visit(page, PATH, scheme);
    await item(page, "Orders").click();
    await expect(item(page, "Overview")).toBeVisible();
    await expectNoAxeFindings(page);

    await toggle(page).click();
    await expect(sidebar(page)).toHaveAttribute("data-state", "collapsed");
    await expectNoAxeFindings(page);
  });
