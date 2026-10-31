/**
 * Stackra file contract:
 * Purpose: the action-menu route's own end-to-end checks: axe finds nothing (violations or incomplete) on the page and
 *          in the open menu in light, dark, left-to-right and right-to-left; every button is icon-only, named by its
 *          label, and names its menu; every variant in every size is present and at least 24 px; the keyboard opens the
 *          menu, skips the disabled action, chooses with Enter and gives focus back to the button; the menu opens below
 *          the button at its reading end by default, and above it at the reading start when asked, in both directions;
 *          the actions show their icon, shortcut hint, danger tone and the reason a disabled one is refused; a disabled
 *          button never opens; and on the live row a press on the row, or on its Open order button, opens the row while
 *          a press on the menu button, on an action, or Enter on an action never does.
 * Boundary: the production build under `vite preview`; Chromium only. React Aria hides everything outside an open
 *           overlay from the accessibility tree, so buttons and sections are found by CSS, and role queries are used
 *           only inside the open menu.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 5); ADR 0303 (decision 7); ADR 0312; ADR 0182 (test tiers); ADR 0022 (test
 *          placement); WCAG 2.2 SC 1.3.1, 2.1.1, 2.5.8, 4.1.2.
 */
// @covers sta-350:FR-109 sta-350:SC-009
import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { pageTitle } from "../support/page-title.function";
import { example } from "../support/example.function";

const SCHEMES = ["light", "dark"] as const;
const LOCALES = ["en", "ar"] as const;
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];
/** How far, in pixels, two edges that should meet may be apart: borders and sub-pixel layout. */
const TOLERANCE = 3;

const open = async (page: Page, scheme: string, locale: string) => {
  await page.emulateMedia({ colorScheme: scheme as "light" | "dark", reducedMotion: "reduce" });
  await page.goto(`/action-menu?scheme=${scheme}&locale=${locale}`);
  await expect(
    page.getByRole("heading", { level: 1, name: pageTitle("Action menu", locale) }),
  ).toBeVisible();
};

/** An example's section by its old heading id (`action-menu-<example>`): CSS, because role queries find nothing while a menu is open. */
const sectionOf = (page: Page, id: string) =>
  example(page, id === "action-menu-basics" ? "usage" : id.slice("action-menu-".length));

/** An action menu's button by its accessible name, found by CSS. */
const buttonIn = (page: Page, id: string, label: string) =>
  sectionOf(page, id).locator(`button[aria-label="${label}"]`);

/** Waits until the popovers stop animating in, so a box or a colour is read at rest. */
const settled = (page: Page) =>
  expect(page.locator('[data-slot="dropdown-popover"][data-entering]')).toHaveCount(0);

/** Opens the menu of a button with a click and returns the menu once it is at rest. */
const openMenu = async (page: Page, button: Locator) => {
  await button.click();
  const menu = page.getByRole("menu").first();
  await expect(menu).toBeVisible();
  await settled(page);
  return menu;
};

const boxOf = async (locator: Locator) => {
  const box = await locator.boundingBox();
  if (!box) throw new Error("a box is missing");
  return box;
};

const BASICS = "Actions for order 1001";
/** The demos speak the page's locale: the Arabic of each English label a test in both directions reads. */
const ARABIC: Record<string, string> = {
  [BASICS]: "إجراءات الطلب 1001",
  "Actions, default placement": "الإجراءات، الموضع الافتراضي",
  "Actions, above": "الإجراءات، في الأعلى",
};
const say = (locale: string, english: string) =>
  locale === "ar" ? (ARABIC[english] ?? english) : english;

/**
 * Hides the page behind the overlay while it is scanned, and shows it again. Axe reads the elements under a see-through
 * backdrop as part of the text's background, and a page that differs from one line of text to the next leaves the
 * contrast check "for review"; the overlay's own colours are what is scanned, and the page has its own axe tests.
 */
const setPageHidden = (page: Page, isHidden: boolean) =>
  page.evaluate((hide) => {
    const root = document.getElementById("root");
    if (root) root.style.visibility = hide ? "hidden" : "";
  }, isHidden);

for (const scheme of SCHEMES)
  for (const locale of LOCALES) {
    test(`axe finds nothing on the action menu page in ${scheme}, ${locale}`, async ({ page }) => {
      await open(page, scheme, locale);
      const { violations, incomplete } = await new AxeBuilder({ page })
        .withTags(AXE_TAGS)
        .analyze();
      expect(
        violations.map((finding) => finding.id),
        "axe violations",
      ).toEqual([]);
      expect(
        incomplete.map((finding) => finding.id),
        "axe checks left for review",
      ).toEqual([]);
    });

    test(`axe finds nothing in the open menu in ${scheme}, ${locale}`, async ({ page }) => {
      await open(page, scheme, locale);
      await openMenu(page, buttonIn(page, "action-menu-basics", say(locale, BASICS)));
      await setPageHidden(page, true);
      const { violations, incomplete } = await new AxeBuilder({ page })
        .include('[role="menu"]')
        .withTags(AXE_TAGS)
        .analyze();
      expect(
        violations.map((finding) => finding.id),
        "axe violations",
      ).toEqual([]);
      expect(
        incomplete.map((finding) => finding.id),
        "axe checks left for review",
      ).toEqual([]);
    });
  }

test("the button is icon-only, named by its label, and names its menu", async ({ page }) => {
  await open(page, "light", "en");
  const button = buttonIn(page, "action-menu-basics", BASICS);
  await expect(button).toHaveAttribute("aria-haspopup", "true");
  await expect(button.locator("svg")).toBeVisible();
  await expect(button).toHaveText("");
  const menu = await openMenu(page, button);
  await expect(menu).toHaveAccessibleName(BASICS);
  await expect(button).toHaveAttribute("aria-expanded", "true");
  // Both groups are named for assistive technology though neither draws a heading.
  await expect(menu.getByRole("group", { name: "Edit" })).toBeVisible();
  await expect(menu.getByRole("group", { name: "Danger zone" })).toBeVisible();
  await expect(menu.getByRole("heading")).toHaveCount(0);
});

test("every variant is present in every size, and every button is at least 24 px", async ({
  page,
}) => {
  await open(page, "light", "en");
  // The demo's buttons only, not the example pane's own toggles and code button.
  const buttons = sectionOf(page, "action-menu-variants").locator(
    'button[aria-label^="Actions, "]',
  );
  // Eight ButtonVariants (glass joined on 2026-10-31) in each of the three Sizes.
  await expect(buttons).toHaveCount(24);
  for (const button of await buttons.all()) {
    const box = await boxOf(button);
    expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(24);
  }
});

test("the actions show their icon, shortcut hint, danger tone and the reason for a disabled one", async ({
  page,
}) => {
  await open(page, "light", "en");
  const menu = await openMenu(page, buttonIn(page, "action-menu-basics", BASICS));
  const rename = menu.getByRole("menuitem", { name: "Rename" });
  await expect(rename.locator("svg")).toBeVisible();
  await expect(rename.locator("kbd")).toHaveText("⌘R");
  await expect(menu.getByRole("menuitem", { name: "Delete" })).toHaveClass(/menu-item--danger/);
  const archive = menu.getByRole("menuitem", { name: "Archive" });
  await expect(archive).toHaveAttribute("aria-disabled", "true");
  await expect(archive).toHaveAccessibleName(/^Archive\s+Paid orders cannot be archived/);
  for (const item of await menu.getByRole("menuitem").all()) {
    const box = await boxOf(item);
    expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(24);
  }
});

test("the keyboard opens the menu, skips the disabled action and chooses with Enter", async ({
  page,
}) => {
  await open(page, "light", "en");
  const live = "action-menu-live";
  const button = buttonIn(page, live, BASICS);
  await button.focus();
  await page.keyboard.press("Enter");
  const menu = page.getByRole("menu").first();
  await expect(menu).toBeVisible();
  await expect(menu.getByRole("menuitem", { name: "Rename" })).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(menu.getByRole("menuitem", { name: "Duplicate" })).toBeFocused();
  // Archive is disabled, so the next stop is Delete.
  await page.keyboard.press("ArrowDown");
  await expect(menu.getByRole("menuitem", { name: "Delete" })).toBeFocused();
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("Enter");
  await expect(menu).toBeHidden();
  await expect(button).toBeFocused();
  await expect(page.getByTestId("action-menu-last-action")).toHaveText("Last action: duplicate");
  // Enter on an action never reached the row.
  await expect(page.getByTestId("action-menu-row-opened")).toHaveText("Row opened 0 times.");
});

test("Escape closes the menu and gives focus back to the button", async ({ page }) => {
  await open(page, "light", "en");
  const button = buttonIn(page, "action-menu-basics", BASICS);
  await button.focus();
  await page.keyboard.press("ArrowDown");
  const menu = page.getByRole("menu").first();
  await expect(menu).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await expect(button).toBeFocused();
});

for (const locale of LOCALES)
  test(`the menu opens below the button at its reading end, or as asked, in ${locale}`, async ({
    page,
  }) => {
    await open(page, "light", locale);
    const placement = "action-menu-placement";
    const isLtr = locale === "en";

    const first = buttonIn(page, placement, say(locale, "Actions, default placement"));
    await first.evaluate((element) => element.scrollIntoView({ block: "center" }));
    let menu = await openMenu(page, first);
    let t = await boxOf(first);
    let m = await boxOf(menu);
    expect(m.y, "below").toBeGreaterThanOrEqual(t.y + t.height - TOLERANCE);
    // The reading end of the menu meets the reading end of the button, so it grows toward the reading start.
    const endEdge = isLtr ? Math.abs(m.x + m.width - (t.x + t.width)) : Math.abs(m.x - t.x);
    expect(endEdge, "end edges meet").toBeLessThanOrEqual(TOLERANCE);
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();

    const second = buttonIn(page, placement, say(locale, "Actions, above"));
    await second.evaluate((element) => element.scrollIntoView({ block: "center" }));
    menu = await openMenu(page, second);
    t = await boxOf(second);
    m = await boxOf(menu);
    expect(m.y + m.height, "above").toBeLessThanOrEqual(t.y + TOLERANCE);
    const startEdge = isLtr ? Math.abs(m.x - t.x) : Math.abs(m.x + m.width - (t.x + t.width));
    expect(startEdge, "start edges meet").toBeLessThanOrEqual(TOLERANCE);
  });

test("a disabled button never opens", async ({ page }) => {
  await open(page, "light", "en");
  const button = buttonIn(page, "action-menu-states", "Actions, unavailable");
  await expect(button).toBeDisabled();
  await button.click({ force: true });
  await expect(page.getByRole("menu")).toHaveCount(0);
});

test("a press on the row or its Open order button opens the row", async ({ page }) => {
  await open(page, "light", "en");
  const live = sectionOf(page, "action-menu-live");
  const opened = page.getByTestId("action-menu-row-opened");
  await expect(opened).toHaveText("Row opened 0 times.");
  await live.getByText("Order 1001").click();
  await expect(opened).toHaveText("Row opened 1 time.");
  const openOrder = live.locator("button", { hasText: "Open order" });
  await openOrder.focus();
  await page.keyboard.press("Enter");
  await expect(opened).toHaveText("Row opened 2 times.");
});

test("a press on the menu button or on an action never opens the row", async ({ page }) => {
  await open(page, "light", "en");
  const opened = page.getByTestId("action-menu-row-opened");
  const menu = await openMenu(page, buttonIn(page, "action-menu-live", BASICS));
  await expect(opened).toHaveText("Row opened 0 times.");
  await menu.getByRole("menuitem", { name: "Rename" }).click();
  await expect(menu).toBeHidden();
  await expect(page.getByTestId("action-menu-last-action")).toHaveText("Last action: rename");
  await expect(opened).toHaveText("Row opened 0 times.");
});
