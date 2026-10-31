/**
 * Stackra file contract:
 * Purpose: the filter bar route's own end-to-end checks: axe finds nothing (violations or incomplete) on the page in
 *          light, dark, left-to-right and right-to-left, and nothing in an open filter editor; each bar is a named
 *          search landmark with a named search box; the add-filter menu opens from the keyboard and lists only the
 *          filters that are not applied, a disabled one refused; a chosen filter opens its editor as a named dialog that
 *          takes focus, and a choice made with the arrow keys is applied at once, written on the chip and kept when
 *          Escape closes the dialog, which gives focus back to the chip; a text filter, a number range and a day range
 *          narrow the live list; a filter left empty loses its chip and focus goes to the add button; the remove button
 *          and clear-all empty the query and move focus on, and clear-all appears only while something narrows; every
 *          press target is at least 24 px; and the search box sits at the reading-start side in both directions.
 * Boundary: the production build under `vite preview`; Chromium only. React Aria hides everything outside an open
 *           overlay from the accessibility tree, so sections are found by CSS, and role queries are used only inside the
 *           open menu or dialog, or while no overlay is open.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 5); ADR 0303 (decision 7); ADR 0318; ADR 0182 (test tiers); ADR 0022 (test
 *          placement); WCAG 2.2 SC 1.3.1, 2.1.1, 2.4.3, 2.5.8, 4.1.2, 4.1.3.
 */
// @covers sta-350:FR-195 sta-350:FR-196 sta-350:FR-197 sta-350:SC-013
import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { pageTitle } from "../support/page-title.function";
import { example } from "../support/example.function";

const SCHEMES = ["light", "dark"] as const;
const LOCALES = ["en", "ar"] as const;
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

const open = async (page: Page, scheme: string, locale: string, material?: "solid") => {
  await page.emulateMedia({ colorScheme: scheme as "light" | "dark", reducedMotion: "reduce" });
  await page.goto(
    `/filter-bar?scheme=${scheme}&locale=${locale}${material === undefined ? "" : `&material=${material}`}`,
  );
  await expect(
    page.getByRole("heading", { level: 1, name: pageTitle("Filter bar", locale) }),
  ).toBeVisible();
};

/** The names the Arabic tests look for: the page translates its demos. */
const ARABIC: Record<string, string> = {
  "Search the live orders, filters": "البحث في الطلبات التفاعلية، عوامل التصفية",
  "Add filter": "إضافة عامل تصفية",
  Status: "الحالة",
};

/** A name in the page's language. */
const inLocale = (page: Page, name: string) =>
  new URL(page.url()).searchParams.get("locale") === "ar" ? (ARABIC[name] ?? name) : name;

/** The live section's bar, found by its landmark name. */
const liveBar = (page: Page) =>
  example(page, "live").getByRole("search", {
    name: inLocale(page, "Search the live orders, filters"),
  });

/** The number of orders the live list shows, from the page's own polite count. */
const matching = (page: Page) =>
  example(page, "live").locator('[role="status"]', { hasText: /match/ });

/**
 * Centres an element in the window, then focuses it. React Aria closes an open list or menu on a scroll, and a field
 * at the window's edge, where focus alone would leave it, scrolls once its list opens below it.
 */
const focusInView = async (locator: Locator) => {
  await locator.evaluate((element) => element.scrollIntoView({ block: "center" }));
  await locator.focus();
};

/** Opens the add-filter menu of a bar with the keyboard and chooses a filter, returning its open editor. */
const addFilter = async (page: Page, bar: Locator, label: string) => {
  const add = bar.getByRole("button", { name: inLocale(page, "Add filter") });
  await focusInView(add);
  await page.keyboard.press("Enter");
  const menu = page.getByRole("menu");
  await expect(menu).toBeVisible();
  await menu.getByRole("menuitem", { name: inLocale(page, label) }).click();
  const dialog = page.getByRole("dialog", { name: inLocale(page, label) });
  await expect(dialog).toBeVisible();
  // Let the open animation finish, so a box or a colour is measured at rest.
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        // Time-based ones only: a scroll-driven fade (the nav edges) runs as long as its scroller can scroll.
        .filter((animation) => animation.timeline === document.timeline)
        .map((animation) => animation.finished),
    ),
  );
  return dialog;
};

const axeFindsNothing = async (page: Page) => {
  // Every lazy demo mounted first: one arriving mid-scan leaves heading-order unable to place its headings.
  await expect(page.locator("[data-demo-loading]")).toHaveCount(0);
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

for (const scheme of SCHEMES)
  for (const locale of LOCALES)
    test(`axe finds nothing on the filter bar page in ${scheme}, ${locale}`, async ({ page }) => {
      await open(page, scheme, locale);
      await axeFindsNothing(page);
    });

for (const [scheme, locale] of [
  ["light", "en"],
  ["dark", "ar"],
] as const)
  test(`axe finds nothing in an open filter editor in ${scheme}, ${locale}`, async ({ page }) => {
    // Scanned solid (the product default): axe cannot see through glass; ADR 0501 decision 4's thick fill and the tokens contrast test cover glass.
    await open(page, scheme, locale, "solid");
    await addFilter(page, liveBar(page), "Status");
    // Scoped to the dialog: it sits in a portal outside the page's landmarks, which the region rule would flag.
    // Only violations are asserted: a surface that is still fading in leaves a colour check for review.
    const { violations } = await new AxeBuilder({ page })
      .include('[role="dialog"]')
      .withTags(AXE_TAGS)
      .analyze();
    expect(
      violations.map((finding) => finding.id),
      "axe violations",
    ).toEqual([]);
  });

test("each bar is a named search landmark with a named search box", async ({ page }) => {
  await open(page, "light", "en");
  const live = liveBar(page);
  await expect(live).toBeVisible();
  await expect(live.getByRole("searchbox", { name: "Search the live orders" })).toBeVisible();
  await expect(page.getByRole("search")).toHaveCount(6);
});

test("the add-filter menu opens from the keyboard and lists only the filters not applied", async ({
  page,
}) => {
  await open(page, "light", "en");
  const applied = example(page, "states").getByRole("search", {
    name: "Search the applied orders, filters",
  });
  const add = applied.getByRole("button", { name: "Add filter" });
  await focusInView(add);
  await page.keyboard.press("Enter");
  const menu = page.getByRole("menu");
  await expect(menu).toBeVisible();
  await expect(menu.getByRole("menuitem").first()).toBeFocused();
  // Status, Region and Total are applied from the start.
  await expect(menu.getByRole("menuitem")).toHaveText(["Customer", "Placed", "Gift order"]);
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await expect(add).toBeFocused();
});

test("a disabled filter is listed and refused", async ({ page }) => {
  await open(page, "light", "en");
  const bar = example(page, "states").getByRole("search", {
    name: "Search the orders with a disabled filter, filters",
  });
  await bar.getByRole("button", { name: "Add filter" }).click();
  const total = page.getByRole("menuitem", { name: "Total" });
  await expect(total).toHaveAttribute("aria-disabled", "true");
  await total.click({ force: true });
  await expect(page.getByRole("menu")).toBeVisible();
  // The menu's own popover is a dialog; the refused filter (the column's `filter.isDisabled`) opens no editor.
  await expect(page.getByRole("dialog", { name: "Total" })).toHaveCount(0);
});

test("a bar with every filter applied has its add button disabled", async ({ page }) => {
  await open(page, "light", "en");
  const bar = example(page, "states").getByRole("search", {
    name: "Search the orders with every filter applied, filters",
  });
  await expect(bar.getByRole("button", { name: "Add filter" })).toBeDisabled();
  await expect(bar.getByRole("button", { name: "Customer: ada" })).toBeVisible();
});

test("a chosen filter opens a named dialog that takes focus, and a choice is applied at once", async ({
  page,
}) => {
  await open(page, "light", "en");
  const live = example(page, "live");
  const dialog = await addFilter(page, liveBar(page), "Status");
  await expect(dialog.getByRole("heading", { level: 2, name: "Status" })).toBeVisible();
  await expect(page.locator('[role="dialog"]:focus, [role="dialog"] :focus')).toHaveCount(1);

  // A choice column filters as "is any of": its options are ticked, and each tick is applied at once.
  // From the keyboard: the input is visually hidden under the drawn box, so a pointer lands on the box instead.
  await dialog.getByRole("checkbox", { name: "Shipped" }).focus();
  await page.keyboard.press("Space");
  await expect(dialog.getByRole("checkbox", { name: "Shipped" })).toBeChecked();
  await expect(live.getByTestId("filter-bar-live-query")).toHaveText("Query: status=shipped");
  await expect(matching(page)).toHaveText("4 orders match.");

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(liveBar(page).getByRole("button", { name: "Status: Shipped" })).toBeVisible();
  await expect(live.getByTestId("filter-bar-live-query")).toHaveText("Query: status=shipped");
});

test("a chip opens its editor with its value, and Escape gives focus back to the chip", async ({
  page,
}) => {
  await open(page, "light", "en");
  const bar = example(page, "states").getByRole("search", {
    name: "Search the applied orders, filters",
  });
  const chip = bar.getByRole("button", { name: "Status: Paid" });
  await focusInView(chip);
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Status" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("checkbox", { name: "Paid" })).toBeChecked();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(chip).toBeFocused();
});

test("a filter of each kind narrows the live list: text, a number range and a day range", async ({
  page,
}) => {
  await open(page, "light", "en");
  const live = example(page, "live");

  const text = await addFilter(page, liveBar(page), "Customer");
  await text.getByRole("textbox", { name: "Customer" }).fill("grace");
  await expect(matching(page)).toHaveText("3 orders match.");
  await page.keyboard.press("Escape");
  await expect(liveBar(page).getByRole("button", { name: "Customer: grace" })).toBeVisible();
  await liveBar(page).getByRole("button", { name: "Remove filter Customer" }).click();

  const number = await addFilter(page, liveBar(page), "Total");
  // React Aria's number input is a textbox, not a spinbutton.
  const minimum = number.getByRole("textbox", { name: "Minimum" });
  await minimum.fill("50");
  await minimum.press("Enter");
  await expect(matching(page)).toHaveText("6 orders match.");
  await page.keyboard.press("Escape");
  await expect(liveBar(page).getByRole("button", { name: /^Total: ≥ \$50/ })).toBeVisible();
  await liveBar(page).getByRole("button", { name: "Remove filter Total" }).click();

  const days = await addFilter(page, liveBar(page), "Placed");
  // The first segment of the first field is the month; typing a whole day moves through the segments by itself.
  await days.getByRole("spinbutton").first().click();
  await page.keyboard.type("03012026");
  await expect(matching(page)).toHaveText("10 orders match.");
  await page.keyboard.press("Escape");
  await expect(liveBar(page).getByRole("button", { name: /^Placed: From/ })).toBeVisible();
  await expect(live.getByTestId("filter-bar-live-query")).toHaveText("Query: placed=2026-03-01..");
});

test("a filter left empty loses its chip and focus goes to the add button", async ({ page }) => {
  await open(page, "light", "en");
  const bar = liveBar(page);
  const dialog = await addFilter(page, bar, "Customer");
  await dialog.getByRole("textbox", { name: "Customer" }).fill("ada");
  await expect(matching(page)).toHaveText("3 orders match.");
  await dialog.getByRole("textbox", { name: "Customer" }).fill("");
  await expect(matching(page)).toHaveText("12 orders match.");
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(bar.getByRole("group", { name: "Customer" })).toHaveCount(0);
  await expect(bar.getByRole("button", { name: "Add filter" })).toBeFocused();
});

test("the remove button removes a filter and moves focus to the add button", async ({ page }) => {
  await open(page, "light", "en");
  const bar = example(page, "states").getByRole("search", {
    name: "Search the applied orders, filters",
  });
  await bar.getByRole("button", { name: "Remove filter Status" }).focus();
  await page.keyboard.press("Enter");
  await expect(bar.getByRole("group", { name: "Status" })).toHaveCount(0);
  await expect(bar.getByRole("button", { name: "Add filter" })).toBeFocused();
  await expect(example(page, "states").getByTestId("filter-bar-applied-query")).toHaveText(
    "Query: region=eu,us; total=20..",
  );
});

test("clear-all appears only while something narrows, and empties search and filters", async ({
  page,
}) => {
  await open(page, "light", "en");
  const bar = liveBar(page);
  await expect(bar.getByRole("button", { name: "Clear all" })).toHaveCount(0);
  await bar.getByRole("searchbox", { name: "Search the live orders" }).fill("ada");
  await expect(matching(page)).toHaveText("3 orders match.");
  await expect(bar.getByRole("button", { name: "Clear all" })).toBeVisible();
  await bar.getByRole("button", { name: "Clear all" }).focus();
  await page.keyboard.press("Enter");
  await expect(bar.getByRole("searchbox", { name: "Search the live orders" })).toHaveValue("");
  await expect(matching(page)).toHaveText("12 orders match.");
  await expect(bar.getByRole("button", { name: "Clear all" })).toHaveCount(0);
  await expect(bar.getByRole("button", { name: "Add filter" })).toBeFocused();
});

test("the count of applied filters is read out politely", async ({ page }) => {
  await open(page, "light", "en");
  const bar = example(page, "states").getByRole("search", {
    name: "Search the applied orders, filters",
  });
  await expect(bar.locator('[role="status"]')).toHaveText("3 filters applied");
  await bar.getByRole("button", { name: "Remove filter Total" }).click();
  await expect(bar.locator('[role="status"]')).toHaveText("2 filters applied");
});

test("every press target of the bar is at least 24 px square", async ({ page }) => {
  await open(page, "light", "en");
  const bar = example(page, "states").getByRole("search", {
    name: "Search the applied orders, filters",
  });
  const targets = [
    bar.getByRole("button", { name: "Add filter" }),
    bar.getByRole("button", { name: "Status: Paid" }),
    bar.getByRole("button", { name: "Remove filter Status" }),
    bar.getByRole("button", { name: "Remove filter Total" }),
  ];
  for (const target of targets) {
    const box = await target.boundingBox();
    if (!box) throw new Error("no box for a press target");
    expect(box.width).toBeGreaterThanOrEqual(24);
    expect(box.height).toBeGreaterThanOrEqual(24);
  }
  const live = liveBar(page);
  await live.getByRole("searchbox", { name: "Search the live orders" }).fill("ada");
  for (const name of ["Clear all", "Clear search"]) {
    const box = await live.getByRole("button", { name }).boundingBox();
    if (!box) throw new Error(`no box for ${name}`);
    expect(box.width).toBeGreaterThanOrEqual(24);
    expect(box.height).toBeGreaterThanOrEqual(24);
  }
});

for (const locale of LOCALES)
  test(`the search box sits at the reading-start side of the add button in ${locale}`, async ({
    page,
  }) => {
    await open(page, "light", locale);
    const bar = liveBar(page);
    const search = await bar.getByRole("searchbox").boundingBox();
    const add = await bar.getByRole("button", { name: inLocale(page, "Add filter") }).boundingBox();
    if (!search || !add) throw new Error("a box is missing");
    expect(search.x < add.x, locale).toBe(locale === "en");
  });
