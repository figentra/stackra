/**
 * Stackra file contract:
 * Purpose: the navigation-header route's own end-to-end checks: axe finds nothing (violations or incomplete) on the page
 *          in light, dark, left-to-right and right-to-left; the page holds one `h1`, no banner landmark and a level 3
 *          title in every header; the parts run from the inline start to the end in the order back button, title, end
 *          slot, and the order mirrors in right-to-left; the back chevron mirrors in right-to-left; a long title shortens
 *          without overflowing its header, also on a 320 px window; the large title sits under the bar; every control
 *          reaches 24 px; the back link keeps its destination; and the back button, the action and the large-title
 *          switch work from the keyboard, report what they did and keep their focus.
 * Boundary: the production build under `vite preview`; Chromium only. No overlay opens on this page, so role queries
 *           work throughout; CSS locators are used only to find a header by its sample.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 5); ADR 0317 (decisions 5 and 7); ADR 0060 (light, dark, RTL); ADR 0182 (test
 *          tiers); ADR 0022 (test placement); WCAG 2.2 SC 1.3.1, 1.4.10, 2.1.1, 2.4.3, 2.4.6, 2.5.8 and 4.1.3.
 */
// @covers sta-350:FR-177 sta-350:SC-012 sta-350:SC-002
import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";

const SCHEMES = ["light", "dark"] as const;
const LOCALES = ["en", "ar"] as const;
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

const open = async (page: Page, scheme: string, locale: string) => {
  await page.emulateMedia({ colorScheme: scheme as "light" | "dark", reducedMotion: "reduce" });
  await page.goto(`/navigation-header?scheme=${scheme}&locale=${locale}`);
  await expect(page.getByRole("heading", { level: 1, name: "Navigation header" })).toBeVisible();
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

/** The headers of the parts section, by their sample, found by CSS. Order: title only, back button, back link, slots, long, large. */
const headers = (page: Page) => page.locator("#navigation-header-parts ~ ul > li header");

/** The live header and its reports. */
const liveHeader = (page: Page) => page.locator('[data-sample="live"] header');
const liveStatus = (page: Page) => page.locator('[data-sample="live-status"] [role="status"]');

for (const scheme of SCHEMES)
  for (const locale of LOCALES)
    test(`axe finds nothing on the navigation header page in ${scheme}, ${locale}`, async ({
      page,
    }) => {
      await open(page, scheme, locale);
      await expectAxeClean(page);
    });

test("the page holds one h1, no banner landmark and a level 3 title in every parts header", async ({
  page,
}) => {
  await open(page, "light", "en");
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.getByRole("banner")).toHaveCount(0);
  const bars = headers(page);
  expect(await bars.count()).toBe(6);
  for (const bar of await bars.all())
    await expect(bar.getByRole("heading", { level: 3 })).toHaveCount(1);
});

for (const locale of LOCALES)
  test(`the parts run from the start to the end of the header in ${locale}`, async ({ page }) => {
    await open(page, "light", locale);
    const bar = headers(page).nth(3);
    const selectors = [
      '[data-slot="avatar-fallback"]',
      '[data-slot="navigation-header-title"]',
      '[data-slot="navigation-header-actions"]',
    ];
    const xs: number[] = [];
    xs.push((await boxOf(bar.getByRole("button", { name: "Back" }))).x);
    for (const selector of selectors) xs.push((await boxOf(bar.locator(selector).first())).x);
    // Left to right the x of each part grows; right to left it shrinks.
    const sorted = [...xs].sort((a, b) => (locale === "en" ? a - b : b - a));
    expect(xs).toEqual(sorted);
  });

for (const locale of LOCALES)
  test(`the back chevron points the reading way back in ${locale}`, async ({ page }) => {
    await open(page, "light", locale);
    const chevron = headers(page).nth(1).getByRole("button", { name: "Back" }).locator("svg");
    const matrix = await chevron.evaluate((element) => getComputedStyle(element).transform);
    // Mirrored in right-to-left: the horizontal scale is negative; otherwise there is no transform.
    if (locale === "en") expect(["none", "matrix(1, 0, 0, 1, 0, 0)"]).toContain(matrix);
    else expect(matrix.startsWith("matrix(-1")).toBe(true);
  });

test("the Arabic header mirrors the English one whatever the page's direction", async ({
  page,
}) => {
  await open(page, "light", "en");
  const block = page.locator('[data-sample="arabic"]');
  const back = await boxOf(block.getByRole("button", { name: "رجوع" }));
  const bell = await boxOf(block.getByRole("button", { name: "الإشعارات" }));
  // Right-to-left: the back button is at the start (right), the action at the end (left).
  expect(back.x).toBeGreaterThan(bell.x);
});

test("the large title sits under the bar's row, and the compact title inside it", async ({
  page,
}) => {
  await open(page, "light", "en");
  const compact = headers(page).nth(1);
  const large = headers(page).nth(5);
  const compactRow = await boxOf(compact.locator("> div").first());
  const compactTitle = await boxOf(compact.getByRole("heading", { level: 3 }));
  expect(compactTitle.y).toBeGreaterThanOrEqual(compactRow.y);
  expect(compactTitle.y + compactTitle.height).toBeLessThanOrEqual(
    compactRow.y + compactRow.height + 1,
  );
  const largeRow = await boxOf(large.locator("> div").first());
  const largeTitle = await boxOf(large.getByRole("heading", { level: 3 }));
  expect(largeTitle.y).toBeGreaterThanOrEqual(largeRow.y + largeRow.height - 1);
});

for (const width of [1280, 320])
  test(`a long title shortens without overflowing its header at ${width} px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await open(page, "light", "en");
    const bar = headers(page).nth(4);
    const title = bar.getByRole("heading", { level: 3 });
    await expect(title).toBeVisible();
    const fits = await bar.evaluate((element) => element.scrollWidth <= element.clientWidth + 1);
    expect(fits).toBe(true);
    const isShortened = await title.evaluate(
      (element) => element.scrollWidth > element.clientWidth,
    );
    expect(isShortened).toBe(true);
  });

test("every control in a header reaches 24 px", async ({ page }) => {
  await open(page, "light", "en");
  const controls = headers(page).locator("button, a");
  expect(await controls.count()).toBeGreaterThan(0);
  for (const control of await controls.all()) {
    const box = await boxOf(control);
    expect(box.width).toBeGreaterThanOrEqual(24);
    expect(box.height).toBeGreaterThanOrEqual(24);
  }
});

test("the back link keeps its destination and is named", async ({ page }) => {
  await open(page, "light", "en");
  const link = headers(page).nth(2).getByRole("link", { name: "Back to home" });
  await expect(link).toHaveAttribute("href", "/");
});

test("the back button and the action work from the keyboard, report themselves and keep focus", async ({
  page,
}) => {
  await open(page, "light", "en");
  const bar = liveHeader(page);
  const back = bar.getByRole("button", { name: "Back" });
  await back.focus();
  await page.keyboard.press("Enter");
  await expect(liveStatus(page).nth(0)).toHaveText("Back pressed once.");
  await expect(back).toBeFocused();
  await page.keyboard.press("Space");
  await expect(liveStatus(page).nth(0)).toHaveText("Back pressed 2 times.");

  const add = bar.getByRole("button", { name: "Add order" });
  await add.focus();
  await page.keyboard.press("Enter");
  await expect(liveStatus(page).nth(1)).toHaveText("1 order added.");
  await expect(add).toBeFocused();
});

test("the large-title switch moves the title under the bar from the keyboard", async ({ page }) => {
  await open(page, "light", "en");
  const bar = liveHeader(page);
  const toggle = page.getByRole("switch", { name: "Large title" });
  const rowOf = () => bar.locator("> div").first();
  const title = bar.getByRole("heading", { level: 3 });
  const isInRow = async () =>
    (await boxOf(title)).y + (await boxOf(title)).height <=
    (await boxOf(rowOf())).y + (await boxOf(rowOf())).height + 1;
  expect(await isInRow()).toBe(true);
  await toggle.focus();
  await page.keyboard.press("Space");
  await expect(liveStatus(page).nth(2)).toHaveText("The title is large, under the bar.");
  expect(await isInRow()).toBe(false);
  await expect(toggle).toBeFocused();
});
