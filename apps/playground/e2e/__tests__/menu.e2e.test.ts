/**
 * Stackra file contract:
 * Purpose: the menu route's own end-to-end checks: axe finds nothing (violations or incomplete) on the page and in the
 *          open menu in light, dark, left-to-right and right-to-left; each trigger names its menu; the keyboard opens a
 *          menu, moves over the enabled actions only (type-ahead included), chooses with Enter and gives focus back to
 *          the trigger, and Escape closes it; a disabled action is refused by a press; an action shows its icon, second
 *          line, reason and shortcut hint, with the hint at the reading-end side; every touch target is at least 24 px;
 *          each side and alignment lands where its reading-direction name says, in both directions; a single choice is
 *          kept per group and several in one, with the mark at the reading-start side; a submenu opens on the
 *          reading-end side; a link action goes to its href; a disabled trigger never opens; and the live menu reports
 *          its last action and can be opened from outside.
 * Boundary: the production build under `vite preview`; Chromium only. React Aria hides everything outside an open
 *           overlay from the accessibility tree, so triggers and sections are found by CSS, and role queries are used
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
  await page.goto(`/menu?scheme=${scheme}&locale=${locale}`);
  await expect(
    page.getByRole("heading", { level: 1, name: pageTitle("Menu", locale) }),
  ).toBeVisible();
};

/** An example's section by its old heading id (`menu-<example>`): CSS, because role queries find nothing while a menu is open. */
const sectionOf = (page: Page, id: string) =>
  example(page, id === "menu-basics" ? "usage" : id.slice("menu-".length));

/** The demos speak the page's locale: the Arabic of each English word a test in both directions reads. */
const ARABIC: Record<string, string> = {
  "Order actions": "إجراءات الطلب",
  Rename: "إعادة تسمية",
  Side: "الجهة",
  Align: "المحاذاة",
  Columns: "الأعمدة",
  Customer: "العميل",
  File: "ملف",
  Export: "تصدير",
  "As PDF": "بصيغة PDF",
};
const say = (locale: string, english: string) =>
  locale === "ar" ? (ARABIC[english] ?? english) : english;

/** A trigger by its text inside a section. */
const triggerIn = (page: Page, id: string, text: string) =>
  sectionOf(page, id).locator("button", { hasText: text });

/** Waits until the popovers stop animating in, so a box or a colour is read at rest. */
const settled = (page: Page) =>
  expect(page.locator('[data-slot="dropdown-popover"][data-entering]')).toHaveCount(0);

/** Opens the menu of a trigger with a click and returns the menu once it is at rest. */
const openMenu = async (page: Page, trigger: Locator) => {
  await trigger.click();
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
    test(`axe finds nothing on the menu page in ${scheme}, ${locale}`, async ({ page }) => {
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
      await openMenu(page, triggerIn(page, "menu-basics", say(locale, "Order actions")));
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

test("a menu is named by its trigger and its groups by their titles", async ({ page }) => {
  await open(page, "light", "en");
  const menu = await openMenu(page, triggerIn(page, "menu-basics", "Order actions"));
  await expect(menu).toHaveAccessibleName("Order actions");
  await expect(menu.getByRole("group", { name: "Edit" })).toBeVisible();
  // The hidden title names its group without a heading being drawn.
  await expect(menu.getByRole("group", { name: "Danger zone" })).toBeVisible();
  await expect(menu.getByText("Danger zone")).toHaveCount(0);
  await expect(menu.getByRole("separator")).toHaveCount(1);
});

test("an action shows its icon, second line, reason, shortcut hint and danger tone", async ({
  page,
}) => {
  await open(page, "light", "en");
  const menu = await openMenu(page, triggerIn(page, "menu-basics", "Order actions"));
  const rename = menu.getByRole("menuitem", { name: "Rename" });
  await expect(rename.locator("svg")).toBeVisible();
  await expect(rename.locator("kbd")).toHaveText("⌘R");
  // The second line is in the name: it is visible text, and a name must hold what is seen (WCAG 2.5.3).
  await expect(menu.getByRole("menuitem", { name: "Duplicate" })).toHaveAccessibleName(
    /^Duplicate\s+Make a copy of the order/,
  );
  const archive = menu.getByRole("menuitem", { name: "Archive" });
  await expect(archive).toHaveAttribute("aria-disabled", "true");
  await expect(archive).toHaveAccessibleName(/^Archive\s+Paid orders cannot be archived/);
  await expect(menu.getByRole("menuitem", { name: "Delete" })).toHaveClass(/menu-item--danger/);
  await expect(menu.getByRole("menuitem", { name: "Rename" })).toHaveClass(/menu-item--default/);
});

for (const locale of LOCALES)
  test(`the shortcut hint sits at the reading-end side in ${locale}`, async ({ page }) => {
    await open(page, "light", locale);
    const menu = await openMenu(page, triggerIn(page, "menu-basics", say(locale, "Order actions")));
    const item = await boxOf(menu.getByRole("menuitem", { name: say(locale, "Rename") }));
    const hint = await boxOf(
      menu.getByRole("menuitem", { name: say(locale, "Rename") }).locator("kbd"),
    );
    const isAfterMiddle = hint.x + hint.width / 2 > item.x + item.width / 2;
    expect(isAfterMiddle, locale).toBe(locale === "en");
  });

test("every trigger and every action is at least 24 px tall and wide", async ({ page }) => {
  await open(page, "light", "en");
  const trigger = triggerIn(page, "menu-basics", "Order actions");
  const triggerBox = await boxOf(trigger);
  expect(Math.min(triggerBox.width, triggerBox.height)).toBeGreaterThanOrEqual(24);
  const menu = await openMenu(page, trigger);
  for (const item of await menu.getByRole("menuitem").all()) {
    const box = await boxOf(item);
    expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(24);
  }
});

test("the keyboard opens the menu, skips the disabled action and chooses with Enter", async ({
  page,
}) => {
  await open(page, "light", "en");
  const live = sectionOf(page, "menu-live");
  const trigger = live.locator("button", { hasText: "Order menu" });
  await trigger.focus();
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
  await expect(trigger).toBeFocused();
  await expect(page.getByTestId("menu-last-action")).toHaveText("Last action: duplicate");
});

test("type-ahead finds an enabled action", async ({ page }) => {
  await open(page, "light", "en");
  const trigger = sectionOf(page, "menu-live").locator("button", { hasText: "Order menu" });
  await trigger.focus();
  await page.keyboard.press("Enter");
  const menu = page.getByRole("menu").first();
  await page.keyboard.type("De");
  await expect(menu.getByRole("menuitem", { name: "Delete" })).toBeFocused();
});

test("type-ahead never lands on a disabled action", async ({ page }) => {
  await open(page, "light", "en");
  const trigger = sectionOf(page, "menu-live").locator("button", { hasText: "Order menu" });
  await trigger.focus();
  await page.keyboard.press("Enter");
  const menu = page.getByRole("menu").first();
  // Archive starts with "A" but is disabled, and no other action does: focus stays on the first one.
  await page.keyboard.type("A");
  await expect(menu.getByRole("menuitem", { name: "Archive" })).not.toBeFocused();
  await expect(menu.getByRole("menuitem", { name: "Rename" })).toBeFocused();
});

test("Escape closes the menu and gives focus back to the trigger", async ({ page }) => {
  await open(page, "light", "en");
  const trigger = triggerIn(page, "menu-basics", "Sort");
  await trigger.focus();
  await page.keyboard.press("ArrowDown");
  const menu = page.getByRole("menu").first();
  await expect(menu).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("a press outside closes the menu without choosing", async ({ page }) => {
  await open(page, "light", "en");
  const menu = await openMenu(
    page,
    sectionOf(page, "menu-live").locator("button", { hasText: "Order menu" }),
  );
  await page.mouse.click(2, 2);
  await expect(menu).toBeHidden();
  await expect(page.getByTestId("menu-last-action")).toHaveText("Last action: none");
});

test("a press on a disabled action is refused and the menu stays open", async ({ page }) => {
  await open(page, "light", "en");
  const menu = await openMenu(
    page,
    sectionOf(page, "menu-live").locator("button", { hasText: "Order menu" }),
  );
  // Forced: Playwright waits forever for an `aria-disabled` item to become enabled, and the point is the refusal.
  await menu.getByRole("menuitem", { name: "Archive" }).click({ force: true });
  await expect(menu).toBeVisible();
  await expect(page.getByTestId("menu-last-action")).toHaveText("Last action: none");
});

for (const locale of LOCALES)
  test(`each side and alignment lands where its reading-direction name says in ${locale}`, async ({
    page,
  }) => {
    await open(page, "light", locale);
    const startIsLeft = locale === "en";
    const placement = "menu-placement";

    for (const side of ["top", "bottom", "start", "end"] as const) {
      const trigger = triggerIn(page, placement, `${say(locale, "Side")} ${side}`);
      // Centred in the viewport, so there is room on every side and the menu does not flip.
      await trigger.evaluate((element) => element.scrollIntoView({ block: "center" }));
      const menu = await openMenu(page, trigger);
      const t = await boxOf(trigger);
      const m = await boxOf(menu);
      if (side === "top") expect(m.y + m.height, side).toBeLessThanOrEqual(t.y + TOLERANCE);
      if (side === "bottom") expect(m.y, side).toBeGreaterThanOrEqual(t.y + t.height - TOLERANCE);
      const isLeft = (side === "start") === startIsLeft;
      if (side === "start" || side === "end") {
        if (isLeft) expect(m.x + m.width, side).toBeLessThanOrEqual(t.x + TOLERANCE);
        else expect(m.x, side).toBeGreaterThanOrEqual(t.x + t.width - TOLERANCE);
      }
      await page.keyboard.press("Escape");
      await expect(menu).toBeHidden();
    }

    for (const align of ["start", "center", "end"] as const) {
      const trigger = triggerIn(page, placement, `${say(locale, "Align")} ${align}`);
      await trigger.evaluate((element) => element.scrollIntoView({ block: "center" }));
      const menu = await openMenu(page, trigger);
      const t = await boxOf(trigger);
      const m = await boxOf(menu);
      const isLeftEdge = (align === "start") === startIsLeft;
      if (align === "center") {
        expect(Math.abs(m.x + m.width / 2 - (t.x + t.width / 2)), align).toBeLessThanOrEqual(
          TOLERANCE,
        );
      } else if (isLeftEdge) {
        expect(Math.abs(m.x - t.x), align).toBeLessThanOrEqual(TOLERANCE);
      } else {
        expect(Math.abs(m.x + m.width - (t.x + t.width)), align).toBeLessThanOrEqual(TOLERANCE);
      }
      await page.keyboard.press("Escape");
      await expect(menu).toBeHidden();
    }
  });

test("a single choice is kept per group, the other group's choice stays", async ({ page }) => {
  await open(page, "light", "en");
  const trigger = triggerIn(page, "menu-selection", "Sort orders");
  const status = page.getByTestId("menu-single-chosen");
  await expect(status).toHaveText("Chosen: desc, date");

  let menu = await openMenu(page, trigger);
  await expect(menu.getByRole("menuitemradio", { name: "Descending" })).toHaveAttribute(
    "aria-checked",
    "true",
  );
  await menu.getByRole("menuitemradio", { name: "Ascending" }).click();
  await expect(status).toHaveText("Chosen: date, asc");
  // A single choice closes the menu.
  await expect(menu).toBeHidden();

  menu = await openMenu(page, trigger);
  await expect(menu.getByRole("menuitemradio", { name: "Ascending" })).toHaveAttribute(
    "aria-checked",
    "true",
  );
  await expect(menu.getByRole("menuitemradio", { name: "Descending" })).toHaveAttribute(
    "aria-checked",
    "false",
  );
  await expect(menu.getByRole("menuitemradio", { name: "Date" })).toHaveAttribute(
    "aria-checked",
    "true",
  );
});

test("several choices are kept in one group and the menu stays open", async ({ page }) => {
  await open(page, "light", "en");
  const status = page.getByTestId("menu-multiple-chosen");
  await expect(status).toHaveText("Chosen: id, customer");
  const menu = await openMenu(page, triggerIn(page, "menu-selection", "Columns"));
  await menu.getByRole("menuitemcheckbox", { name: "Total" }).click();
  await expect(status).toHaveText("Chosen: id, customer, total");
  await menu.getByRole("menuitemcheckbox", { name: "Customer" }).click();
  await expect(status).toHaveText("Chosen: id, total");
  await expect(menu).toBeVisible();
  await expect(menu.getByRole("menuitemcheckbox", { name: "Customer" })).toHaveAttribute(
    "aria-checked",
    "false",
  );
});

for (const locale of LOCALES)
  test(`the selection mark sits at the reading-start side in ${locale}`, async ({ page }) => {
    await open(page, "light", locale);
    const menu = await openMenu(page, triggerIn(page, "menu-selection", say(locale, "Columns")));
    const item = menu.getByRole("menuitemcheckbox", { name: say(locale, "Customer") });
    const itemBox = await boxOf(item);
    const mark = await boxOf(item.locator('[data-slot="menu-item-indicator"]'));
    const isBeforeMiddle = mark.x + mark.width / 2 < itemBox.x + itemBox.width / 2;
    expect(isBeforeMiddle, locale).toBe(locale === "en");
  });

for (const locale of LOCALES)
  test(`a submenu opens on the reading-end side in ${locale}`, async ({ page }) => {
    await open(page, "light", locale);
    const menu = await openMenu(page, triggerIn(page, "menu-submenu", say(locale, "File")));
    const parent = menu.getByRole("menuitem", { name: say(locale, "Export") });
    await expect(parent).toHaveAttribute("aria-haspopup", "menu");
    await parent.focus();
    await page.keyboard.press(locale === "en" ? "ArrowRight" : "ArrowLeft");
    const sub = page.getByRole("menuitem", { name: say(locale, "As PDF") });
    await expect(sub).toBeVisible();
    await settled(page);
    const parentBox = await boxOf(menu);
    const subBox = await boxOf(sub);
    expect(subBox.x > parentBox.x, locale).toBe(locale === "en");
    // The chevron points the reading way: it sits at the reading-end of its action.
    const row = await boxOf(parent);
    const chevron = await boxOf(parent.locator('[data-slot="submenu-indicator"]'));
    expect(chevron.x + chevron.width / 2 > row.x + row.width / 2, locale).toBe(locale === "en");
  });

test("choosing a submenu action runs it and closes the whole menu", async ({ page }) => {
  await open(page, "light", "en");
  const trigger = triggerIn(page, "menu-submenu", "File");
  const menu = await openMenu(page, trigger);
  await menu.getByRole("menuitem", { name: "Export" }).focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Enter");
  await expect(menu).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("a link action goes to its href", async ({ page }) => {
  await open(page, "light", "en");
  const menu = await openMenu(page, triggerIn(page, "menu-states", "Go to"));
  const link = menu.getByRole("menuitem", { name: "Typography page" });
  await expect(link).toHaveAttribute("href", "/typography");
  await link.click();
  await expect(page).toHaveURL(/\/typography/);
});

test("a disabled trigger never opens", async ({ page }) => {
  await open(page, "light", "en");
  const trigger = triggerIn(page, "menu-states", "Disabled menu");
  await expect(trigger).toBeDisabled();
  await trigger.click({ force: true });
  await expect(page.getByRole("menu")).toHaveCount(0);
});

test("the live menu reports its last action and open state, and opens from outside", async ({
  page,
}) => {
  await open(page, "light", "en");
  const live = sectionOf(page, "menu-live");
  const state = page.getByTestId("menu-open-state");
  await expect(state).toHaveText("The menu is closed.");
  await live.locator("button", { hasText: "Open the menu" }).click();
  const menu = page.getByRole("menu").first();
  await expect(menu).toBeVisible();
  await expect(state).toHaveText("The menu is open.");
  await menu.getByRole("menuitem", { name: "Rename" }).click();
  await expect(page.getByTestId("menu-last-action")).toHaveText("Last action: rename");
  await expect(state).toHaveText("The menu is closed.");
});
