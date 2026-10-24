/**
 * Stackra file contract:
 * Purpose: the app-header route's own end-to-end checks: axe finds nothing (violations or incomplete) on the page in
 *          light, dark, left-to-right and right-to-left; the bar draws its parts from the inline start to the end in
 *          the order start slot, title, search, end slot, user menu, and the order mirrors in right-to-left; the search
 *          slot takes the room left over so the end parts stay at the end; every control in a bar reaches 24 px; a long
 *          title shortens without overflowing the bar, also on a 320 px window; the page holds no banner landmark and
 *          one `h1`; the bell and the search report from the keyboard; and the account menu opens from the keyboard,
 *          chooses an entry, and returns focus to its button on Escape and on a choice.
 * Boundary: the production build under `vite preview`; Chromium only. React Aria hides everything outside an open menu
 *           from the accessibility tree, so role queries outside one find nothing: CSS locators are used while a menu
 *           is open and role queries after it closes.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 5); ADR 0314 (decision 5); ADR 0060 (light, dark, RTL); ADR 0182 (test
 *          tiers); ADR 0022 (test placement); WCAG 2.2 SC 1.3.1, 1.4.10, 2.1.1, 2.4.3, 2.5.8 and 4.1.3.
 */
// @covers sta-350:FR-168 sta-350:SC-012 sta-350:SC-002
import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";

const SCHEMES = ["light", "dark"] as const;
const LOCALES = ["en", "ar"] as const;
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

const open = async (page: Page, scheme: string, locale: string) => {
  await page.emulateMedia({ colorScheme: scheme as "light" | "dark", reducedMotion: "reduce" });
  await page.goto(`/app-header?scheme=${scheme}&locale=${locale}`);
  await expect(page.getByRole("heading", { level: 1, name: "App header" })).toBeVisible();
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

/** The bars of the parts section, by their sample, found by CSS. */
const bars = (page: Page) => page.locator("#app-header-parts ~ ul > li header");

/** The live bar and its reports. */
const liveBar = (page: Page) => page.locator('[data-sample="live"] header');
const liveStatus = (page: Page) => page.locator('[data-sample="live-status"] [role="status"]');

for (const scheme of SCHEMES)
  for (const locale of LOCALES)
    test(`axe finds nothing on the app header page in ${scheme}, ${locale}`, async ({ page }) => {
      await open(page, scheme, locale);
      await expectAxeClean(page);
    });

test("the page holds one h1, no banner landmark and no heading made from a bar's title", async ({
  page,
}) => {
  await open(page, "light", "en");
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.getByRole("banner")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Acme", exact: true })).toHaveCount(0);
});

for (const locale of LOCALES)
  test(`the parts run from the start to the end of the bar in ${locale}`, async ({ page }) => {
    await open(page, "light", locale);
    const bar = bars(page).first();
    const names = [
      'button[aria-label="Open navigation"]',
      '[data-slot="app-header-title"]',
      'input[aria-label="Search orders"]',
      'button[aria-label="Notifications, 2 unread"]',
      'button[aria-label="Account menu"]',
    ];
    const xs: number[] = [];
    for (const selector of names) xs.push((await boxOf(bar.locator(selector))).x);
    // Left to right the x of each part grows; right to left it shrinks.
    const sorted = [...xs].sort((a, b) => (locale === "en" ? a - b : b - a));
    expect(xs).toEqual(sorted);
    const barBox = await boxOf(bar);
    const account = await boxOf(bar.locator('button[aria-label="Account menu"]'));
    // The user menu is the last part: it sits at the end edge, inside the bar's padding, in either direction.
    if (locale === "en")
      expect(barBox.x + barBox.width - (account.x + account.width)).toBeLessThan(24);
    else expect(account.x - barBox.x).toBeLessThan(24);
  });

test("the search slot takes the room left over, so the end parts stay at the end without a search", async ({
  page,
}) => {
  await open(page, "light", "en");
  // The first bar has a search; the second is a title alone, and its (empty) search slot still fills the bar.
  const titleOnly = bars(page).nth(1);
  const barBox = await boxOf(titleOnly);
  const slot = await boxOf(titleOnly.locator('[data-slot="app-header-search"]'));
  expect(slot.width).toBeGreaterThan(barBox.width / 2);
});

test("every control in a bar reaches 24 px", async ({ page }) => {
  await open(page, "light", "en");
  const controls = page.locator("#app-header-parts ~ ul > li header").locator("button, input");
  expect(await controls.count()).toBeGreaterThan(0);
  for (const control of await controls.all()) {
    if (!(await control.isVisible())) continue;
    const box = await boxOf(control);
    expect(box.width).toBeGreaterThanOrEqual(24);
    expect(box.height).toBeGreaterThanOrEqual(24);
  }
});

for (const width of [1280, 320])
  test(`a long title shortens without overflowing its bar at ${width} px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await open(page, "light", "en");
    const bar = bars(page).nth(4);
    const title = bar.locator('[data-slot="app-header-title"]');
    await expect(title).toBeVisible();
    const fits = await bar.evaluate((element) => element.scrollWidth <= element.clientWidth + 1);
    expect(fits).toBe(true);
    const isShortened = await title.evaluate(
      (element) => element.scrollWidth > element.clientWidth,
    );
    expect(isShortened).toBe(true);
  });

test("the bar of every part stays inside its box on a 320 px window", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await open(page, "light", "en");
  const bar = bars(page).first();
  const fits = await bar.evaluate((element) => element.scrollWidth <= element.clientWidth + 1);
  expect(fits).toBe(true);
});

test("the search reports what was typed, and the bell counts from the keyboard", async ({
  page,
}) => {
  await open(page, "light", "en");
  const bar = liveBar(page);
  await bar.getByRole("searchbox", { name: "Search orders" }).fill("refund");
  await expect(liveStatus(page).nth(0)).toHaveText("Searching for “refund”.");

  const bell = bar.getByRole("button", { name: "Notifications, 2 unread" });
  await bell.focus();
  await page.keyboard.press("Enter");
  await expect(liveStatus(page).nth(1)).toHaveText("3 unread notifications.");
  await expect(bar.getByRole("button", { name: "Notifications, 3 unread" })).toBeFocused();
  await page.keyboard.press("Space");
  await expect(liveStatus(page).nth(1)).toHaveText("4 unread notifications.");
});

test("the account menu opens from the keyboard, chooses an entry and returns focus to its button", async ({
  page,
}) => {
  await open(page, "light", "en");
  const trigger = liveBar(page).locator('button[aria-label="Account menu"]');
  await trigger.focus();
  await page.keyboard.press("Enter");
  const menu = page.getByRole("menu");
  await expect(menu).toBeVisible();
  await expect(menu.getByRole("menuitem", { name: "Profile" })).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await expect(menu.getByRole("menuitem", { name: "Sign out" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("menu")).toHaveCount(0);
  await expect(liveStatus(page).nth(2)).toHaveText("Account action chosen: Sign out.");
  await expect(trigger).toBeFocused();
});

test("Escape closes the account menu and returns focus to its button", async ({ page }) => {
  await open(page, "light", "en");
  const trigger = liveBar(page).locator('button[aria-label="Account menu"]');
  await trigger.click();
  await expect(page.getByRole("menu")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("menu")).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

for (const locale of LOCALES)
  test(`the Arabic bar mirrors the English one in ${locale}`, async ({ page }) => {
    await open(page, "light", locale);
    const bar = page.locator('[data-sample="arabic"] header');
    const menu = await boxOf(bar.locator('button[aria-label="قائمة الحساب"]'));
    const navigation = await boxOf(bar.locator('button[aria-label="فتح التنقل"]'));
    // The block is right-to-left whatever the page's direction: the start slot is right of the user menu.
    expect(navigation.x).toBeGreaterThan(menu.x);
  });
