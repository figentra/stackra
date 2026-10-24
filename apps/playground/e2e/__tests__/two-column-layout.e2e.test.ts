/**
 * Stackra file contract:
 * Purpose: the two-column-layout route's own end-to-end checks: axe finds nothing (violations or incomplete) on the
 *          page in light, dark, left-to-right and right-to-left, also after the live layout has changed; the page holds
 *          one `h1` and its sections are level-3 headings; from 1024 px the side column is a 20 rem column beside the
 *          main one at the end of the line (at the left in right-to-left) and below it the side column is under the
 *          main one; `collapseBelow` moves the collapse point to 768 px or 1280 px; the Arabic layout mirrors whatever the
 *          page's direction; the page does not scroll sideways at 320 px; and the live layout's switch adds a section
 *          to the side column from the keyboard.
 * Boundary: the production build under `vite preview`; Chromium only. A layout collapses by the viewport's width, so
 *           each case sets its viewport before the page opens. The layout draws no landmark, so the checks use CSS
 *           locators for its columns and role queries for the sections inside them.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 5); ADR 0314 (decisions 1 and 6); ADR 0060 (light, dark, RTL); ADR 0182 (test
 *          tiers); ADR 0022 (test placement); WCAG 2.2 SC 1.3.1, 1.3.2, 1.4.10, 2.1.1 and 4.1.3.
 */
// @covers sta-350:FR-173 sta-350:SC-012 sta-350:SC-002
import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";

const SCHEMES = ["light", "dark"] as const;
const LOCALES = ["en", "ar"] as const;
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

const open = async (page: Page, scheme: string, locale: string, width = 1280) => {
  await page.setViewportSize({ width, height: 900 });
  await page.emulateMedia({ colorScheme: scheme as "light" | "dark", reducedMotion: "reduce" });
  await page.goto(`/two-column-layout?scheme=${scheme}&locale=${locale}`);
  await expect(page.getByRole("heading", { level: 1, name: "Two column layout" })).toBeVisible();
};

/** Runs axe over the page and expects neither violations nor checks left for review. */
const expectAxeClean = async (page: Page) => {
  const { violations, incomplete } = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
  expect(
    violations.map((finding) => finding.id),
    "axe violations",
  ).toEqual([]);
  expect(
    incomplete.map((finding) => finding.id),
    "axe checks left for review",
  ).toEqual([]);
};

const boxOf = async (locator: Locator) => {
  const box = await locator.boundingBox();
  if (!box) throw new Error("the element has no box");
  return box;
};

/** The two columns of a sample's layout, found by CSS. */
const columns = (page: Page, name: string) => ({
  main: page.locator(`[data-sample="${name}"] [data-slot="two-column-main"]`),
  aside: page.locator(`[data-sample="${name}"] [data-slot="two-column-aside"]`),
});

/** True when the side column is beside the main one rather than under it. */
const isBeside = async (page: Page, name: string) => {
  const { main, aside } = columns(page, name);
  const mainBox = await boxOf(main);
  const asideBox = await boxOf(aside);
  return asideBox.y < mainBox.y + mainBox.height - 1;
};

for (const scheme of SCHEMES)
  for (const locale of LOCALES) {
    test(`axe finds nothing on the two column layout page in ${scheme}, ${locale}`, async ({
      page,
    }) => {
      await open(page, scheme, locale);
      await expectAxeClean(page);
    });

    test(`axe finds nothing after the live layout changes in ${scheme}, ${locale}`, async ({
      page,
    }) => {
      await open(page, scheme, locale);
      await page.getByRole("switch", { name: "Show the history" }).focus();
      await page.keyboard.press("Space");
      await expect(page.getByRole("heading", { level: 3, name: "Live history" })).toBeVisible();
      await expectAxeClean(page);
    });

    test(`axe finds nothing on the stacked layout at 700 px in ${scheme}, ${locale}`, async ({
      page,
    }) => {
      await open(page, scheme, locale, 700);
      await expectAxeClean(page);
    });
  }

test("the page holds one h1 and its sections are level-3 headings", async ({ page }) => {
  await open(page, "light", "en");
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 4 })).toHaveCount(0);
  const { main, aside } = columns(page, "default");
  await expect(main.getByRole("heading", { level: 3 })).toHaveCount(2);
  await expect(aside.getByRole("heading", { level: 3 })).toHaveCount(2);
});

test("from 1024 px the side column is 20 rem wide beside the main one, at the end of the line", async ({
  page,
}) => {
  await open(page, "light", "en");
  const { main, aside } = columns(page, "default");
  const mainBox = await boxOf(main);
  const asideBox = await boxOf(aside);
  expect(await isBeside(page, "default")).toBe(true);
  expect(asideBox.width).toBeCloseTo(320, 0);
  expect(asideBox.x).toBeGreaterThan(mainBox.x + mainBox.width - 1);
  expect(asideBox.y).toBeCloseTo(mainBox.y, 0);
});

test("in right-to-left the side column mirrors to the left of the main one", async ({ page }) => {
  await open(page, "light", "ar");
  const { main, aside } = columns(page, "default");
  const mainBox = await boxOf(main);
  const asideBox = await boxOf(aside);
  expect(asideBox.x + asideBox.width).toBeLessThan(mainBox.x + 1);
});

test("below 1024 px the side column is under the main one, in the same column", async ({
  page,
}) => {
  await open(page, "light", "en", 1000);
  const { main, aside } = columns(page, "default");
  const mainBox = await boxOf(main);
  const asideBox = await boxOf(aside);
  expect(await isBeside(page, "default")).toBe(false);
  expect(asideBox.y).toBeGreaterThan(mainBox.y + mainBox.height - 1);
  expect(asideBox.x).toBeCloseTo(mainBox.x, 0);
  expect(asideBox.width).toBeCloseTo(mainBox.width, 0);
});

test("collapseBelow md and xl move the collapse point to 768 px and 1280 px", async ({ page }) => {
  await open(page, "light", "en", 1100);
  expect(await isBeside(page, "md")).toBe(true);
  expect(await isBeside(page, "xl")).toBe(false);
  await page.setViewportSize({ width: 1300, height: 900 });
  expect(await isBeside(page, "xl")).toBe(true);
  await page.setViewportSize({ width: 767, height: 900 });
  expect(await isBeside(page, "md")).toBe(false);
  await page.setViewportSize({ width: 768, height: 900 });
  expect(await isBeside(page, "md")).toBe(true);
});

test("the main column comes first in the document, whatever the width", async ({ page }) => {
  await open(page, "light", "en", 700);
  const order = await page
    .locator('[data-sample="default"] > div > [data-slot]')
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-slot")));
  expect(order).toEqual(["two-column-main", "two-column-aside"]);
});

test("the page does not scroll sideways at 320 px", async ({ page }) => {
  await open(page, "light", "en", 320);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

for (const locale of LOCALES)
  test(`the Arabic layout mirrors whatever the page's direction, in ${locale}`, async ({
    page,
  }) => {
    await open(page, "light", locale);
    const { main, aside } = columns(page, "arabic");
    const mainBox = await boxOf(main);
    const asideBox = await boxOf(aside);
    expect(asideBox.x + asideBox.width).toBeLessThan(mainBox.x + 1);
  });

test("the live layout's switch adds a history section to the side column from the keyboard", async ({
  page,
}) => {
  await open(page, "light", "en");
  const { main, aside } = columns(page, "live");
  const status = page.locator('[data-sample="live-status"]');
  await expect(status).toHaveText("The side column holds the summary only.");
  await expect(aside.getByRole("heading", { level: 3 })).toHaveCount(1);
  const toggle = page.getByRole("switch", { name: "Show the history" });
  await toggle.focus();
  await page.keyboard.press("Space");
  await expect(toggle).toBeChecked();
  await expect(aside.getByRole("heading", { level: 3 })).toHaveText([
    "Live summary",
    "Live history",
  ]);
  await expect(main.getByRole("heading", { level: 3 })).toHaveCount(1);
  await expect(status).toHaveText("The history is in the side column.");
  await expect(toggle).toBeFocused();
});
