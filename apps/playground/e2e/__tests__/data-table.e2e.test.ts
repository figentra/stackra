/**
 * Stackra file contract:
 * Purpose: the data table route's own end-to-end checks: axe finds nothing (violations or incomplete) on the page, and
 *          with a row menu open, in light, dark, left-to-right and right-to-left; a sortable header sorts through the
 *          query by the pointer and the keyboard; a row's menu opens from the keyboard, runs an action, and gives focus
 *          back to its button; a slow action shows itself working and refuses a second run, a refused action says why, and
 *          a failing action is reported without an error reaching the page; several selected rows bring up the bulk bar
 *          with a polite count, offer all matching for a fully selected page, and a failing bulk action leaves the
 *          selection while a successful one clears it and moves focus on; the filter bar slot narrows the rows; the
 *          empty, no-results, first-load, reload and error states are shown; the cursor pager walks forward and back; the
 *          live table searches, shows a failed load and recovers; every press target is at least 24 px; and the first
 *          column sits at the reading-start side in both directions.
 * Boundary: the production build under `vite preview`; Chromium only. React Aria hides everything outside an open
 *           overlay from the accessibility tree, so sections are found by CSS, and role queries are used only inside the
 *           open menu or while no overlay is open.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 5); ADR 0303 (decision 7); ADR 0313; ADR 0318; ADR 0182 (test tiers); ADR 0022
 *          (test placement); WCAG 2.2 SC 1.3.1, 2.1.1, 2.4.3, 2.5.8, 4.1.2, 4.1.3.
 */
// @covers sta-350:FR-188 sta-350:FR-189 sta-350:FR-190 sta-350:FR-192 sta-350:FR-193 sta-350:SC-013
import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";

const SCHEMES = ["light", "dark"] as const;
const LOCALES = ["en", "ar"] as const;
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

const open = async (page: Page, scheme: string, locale: string) => {
  await page.emulateMedia({ colorScheme: scheme as "light" | "dark", reducedMotion: "reduce" });
  await page.goto(`/data-table?scheme=${scheme}&locale=${locale}`);
  await expect(page.getByRole("heading", { level: 1, name: "Data table" })).toBeVisible();
};

/** A section by its heading id: CSS, because role queries find nothing while a menu is open. */
const sectionOf = (page: Page, id: string) => page.locator(`section[aria-labelledby="${id}"]`);

/** The visible box of a selection checkbox inside a row or the header: the input itself is visually hidden. */
const boxIn = (scope: Locator) => scope.locator('[data-slot="checkbox-content"]');

/** The text of a grid's row-header cells, in row order. */
const rowHeaders = (grid: Locator) => grid.getByRole("rowheader").allTextContents();

/** A row's menu button, by its accessible name, found by CSS. */
const menuButton = (section: Locator, order: string) =>
  section.locator(`button[aria-label="Actions for ${order}"]`);

/** Opens a menu with a click and returns it once it is on screen. */
const openMenu = async (page: Page, button: Locator) => {
  await button.click();
  const menu = page.getByRole("menu").first();
  await expect(menu).toBeVisible();
  await expect(page.locator('[data-slot="dropdown-popover"][data-entering]')).toHaveCount(0);
  return menu;
};

const axe = async (page: Page) => {
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
    test(`axe finds nothing on the data table page in ${scheme}, ${locale}`, async ({ page }) => {
      await open(page, scheme, locale);
      await axe(page);
    });

for (const [scheme, locale] of [
  ["light", "en"],
  ["dark", "ar"],
] as const)
  test(`axe finds nothing with a row menu open in ${scheme}, ${locale}`, async ({ page }) => {
    await open(page, scheme, locale);
    await openMenu(page, menuButton(sectionOf(page, "data-table-row-actions"), "#1002"));
    await axe(page);
  });

test("a press on a sortable header sorts through the query, and Enter and Space do too", async ({
  page,
}) => {
  await open(page, "light", "en");
  const sorting = sectionOf(page, "data-table-sorting");
  const grid = sorting.getByRole("grid", { name: "Orders, sorted by the server" });
  await expect(sorting.getByTestId("data-table-sort")).toHaveText("Sorted by: total, descending");
  expect(await rowHeaders(grid)).toEqual(["#1018", "#1013", "#1008", "#1003", "#1020", "#1015"]);
  await expect(grid.getByRole("columnheader", { name: "Total" })).toHaveAttribute(
    "aria-sort",
    "descending",
  );

  await grid.getByRole("columnheader", { name: "Total" }).click();
  await expect(sorting.getByTestId("data-table-sort")).toHaveText("Sorted by: total, ascending");
  await expect(grid.getByRole("rowheader").first()).toHaveText("#1001");

  await grid.getByRole("columnheader", { name: "Customer" }).focus();
  await page.keyboard.press("Enter");
  await expect(sorting.getByTestId("data-table-sort")).toHaveText("Sorted by: customer, ascending");
  await page.keyboard.press("Space");
  await expect(sorting.getByTestId("data-table-sort")).toHaveText(
    "Sorted by: customer, descending",
  );
});

test("a row menu opens from the keyboard, runs an action and gives focus back to its button", async ({
  page,
}) => {
  await open(page, "light", "en");
  const actions = sectionOf(page, "data-table-row-actions");
  const trigger = menuButton(actions, "#1002");
  // As a keyboard user does: onto the row, then along its cells with the arrow keys to the menu button. A script's
  // own focus on the button is moved to the grid's first row by React Aria.
  const row = actions.getByRole("row").filter({ hasText: "#1002" });
  await row.evaluate((element) => (element as HTMLElement).focus());
  for (let step = 0; step < 8; step += 1) {
    if (await trigger.evaluate((button) => button === document.activeElement)) break;
    await page.keyboard.press("ArrowRight");
  }
  await expect(trigger).toBeFocused();
  await page.keyboard.press("Enter");
  const menu = page.getByRole("menu");
  await expect(menu).toBeVisible();
  await expect(menu.getByRole("menuitem").first()).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(menu).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(actions.getByTestId("data-table-last-action")).toHaveText("Last action: Open #1002");
});

test("a slow action shows itself working and refuses a second run", async ({ page }) => {
  await open(page, "light", "en");
  const actions = sectionOf(page, "data-table-row-actions");
  const trigger = menuButton(actions, "#1002");
  const menu = await openMenu(page, trigger);
  await menu.getByRole("menuitem", { name: "Archive" }).click();
  await expect(menu).toBeHidden();

  const again = await openMenu(page, trigger);
  const archive = again.getByRole("menuitem", { name: /^Archive/ });
  await expect(archive).toHaveAttribute("aria-disabled", "true");
  await expect(archive).toContainText("Working");
  await page.keyboard.press("Escape");
  await expect(actions.getByTestId("data-table-last-action")).toHaveText(
    "Last action: Archive #1002 done",
  );
  const done = await openMenu(page, trigger);
  await expect(done.getByRole("menuitem", { name: "Archive" })).not.toHaveAttribute(
    "aria-disabled",
    "true",
  );
});

test("a refused action says why and is not run by the pointer", async ({ page }) => {
  await open(page, "light", "en");
  const actions = sectionOf(page, "data-table-row-actions");
  // Order #1002 is pending, so it cannot be refunded; #1001 is paid.
  const menu = await openMenu(page, menuButton(actions, "#1002"));
  const refund = menu.getByRole("menuitem", { name: /^Refund/ });
  await expect(refund).toHaveAttribute("aria-disabled", "true");
  await expect(refund).toContainText("Only paid orders can be refunded");
  await refund.click({ force: true });
  await expect(menu).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(actions.getByTestId("data-table-last-action")).toHaveText("Last action: none");

  const paid = await openMenu(page, menuButton(actions, "#1001"));
  await expect(paid.getByRole("menuitem", { name: "Refund" })).not.toHaveAttribute(
    "aria-disabled",
    "true",
  );
});

test("a failing action is reported by the page and no error reaches the browser", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await open(page, "light", "en");
  const actions = sectionOf(page, "data-table-row-actions");
  const menu = await openMenu(page, menuButton(actions, "#1001"));
  await menu.getByRole("menuitem", { name: "Delete" }).click();
  await expect(actions.getByTestId("data-table-last-action")).toHaveText(
    "Last action: Delete #1001 failed",
  );
  expect(errors).toEqual([]);
});

test("several selected rows bring up the bulk bar with a polite count and select all matching", async ({
  page,
}) => {
  await open(page, "light", "en");
  const selection = sectionOf(page, "data-table-selection");
  const toolbar = selection.getByRole("toolbar", { name: "Orders, several selected actions" });
  const grid = selection.getByRole("grid", { name: "Orders, several selected" });
  const count = selection.locator('div[role="status"].sr-only', { hasText: /selected$/ });
  await expect(toolbar).toContainText("2 selected");
  await expect(count).toHaveText("2 selected");
  await expect(toolbar.getByRole("button", { name: /^Select all/ })).toHaveCount(0);

  for (const order of ["#1003", "#1004", "#1005"])
    await boxIn(grid.getByRole("row", { name: new RegExp(order) })).click();
  await expect(count).toHaveText("5 selected");
  await toolbar.getByRole("button", { name: "Select all 24" }).click();
  await expect(selection.getByTestId("data-table-all-matching")).toHaveText("All matching: yes");
  await expect(count).toHaveText("24 selected");
  await toolbar.getByRole("button", { name: "Select only the 5 shown" }).click();
  await expect(selection.getByTestId("data-table-all-matching")).toHaveText("All matching: no");
  await expect(count).toHaveText("5 selected");
});

test("a failing bulk action leaves the selection, and a successful one clears it and moves focus on", async ({
  page,
}) => {
  await open(page, "light", "en");
  const selection = sectionOf(page, "data-table-selection");
  const toolbar = selection.getByRole("toolbar", { name: "Orders, several selected actions" });
  const selected = selection.getByTestId("data-table-selected");

  await toolbar.getByRole("button", { name: "Delete" }).click();
  await expect(selection.getByTestId("data-table-bulk-action")).toHaveText(
    "Last action: Delete failed",
  );
  await expect(selected).toHaveText("Selected: ord-1001, ord-1002");
  await expect(toolbar).toBeVisible();

  const archive = toolbar.getByRole("button", { name: "Archive" });
  await archive.click();
  await expect(toolbar.locator("button[data-pending]")).toHaveCount(1);
  await expect(selected).toHaveText("Selected: none");
  await expect(toolbar).toHaveCount(0);
  // The bar went with focus inside it; focus moves to the table's container, not to the top of the page.
  await expect(selection.locator('div.outline-none[tabindex="-1"]')).toBeFocused();
});

test("the clear button empties the selection from the keyboard and moves focus on", async ({
  page,
}) => {
  await open(page, "light", "en");
  const selection = sectionOf(page, "data-table-selection");
  const toolbar = selection.getByRole("toolbar", { name: "Orders, several selected actions" });
  await toolbar.getByRole("button", { name: "Clear selection" }).focus();
  await page.keyboard.press("Enter");
  await expect(selection.getByTestId("data-table-selected")).toHaveText("Selected: none");
  await expect(toolbar).toHaveCount(0);
  await expect(selection.locator('div.outline-none[tabindex="-1"]')).toBeFocused();
});

test("the toolbar moves between its buttons with the arrow keys", async ({ page }) => {
  await open(page, "light", "en");
  const toolbar = sectionOf(page, "data-table-selection").getByRole("toolbar", {
    name: "Orders, several selected actions",
  });
  await toolbar.getByRole("button").first().focus();
  await page.keyboard.press("ArrowRight");
  await expect(toolbar.getByRole("button").nth(1)).toBeFocused();
});

test("the filter bar slot narrows the rows from a search field", async ({ page }) => {
  await open(page, "light", "en");
  const slot = sectionOf(page, "data-table-filter-slot");
  const grid = slot.getByRole("grid", { name: "Orders, with a search above" });
  await expect(grid.getByRole("row")).toHaveCount(6);
  await slot.getByRole("searchbox", { name: "Search the orders" }).fill("grace");
  await expect(slot.getByTestId("data-table-slot-query")).toHaveText("Search: grace");
  expect(await rowHeaders(grid)).toEqual(["#1002", "#1006", "#1010", "#1014", "#1018"]);
});

test("each state of the list is shown", async ({ page }) => {
  await open(page, "light", "en");
  const states = sectionOf(page, "data-table-states");
  await expect(states.getByRole("heading", { name: "Nothing here yet" })).toBeVisible();
  await expect(states.getByRole("heading", { name: "No results", exact: true })).toBeVisible();
  await expect(states.getByRole("button", { name: "Clear filters" })).toBeVisible();
  await expect(states.getByRole("grid", { name: "Orders, reloading" })).toBeVisible();
  await expect(states.getByRole("alert")).toContainText("The order service did not answer.");
  await expect(states.getByRole("button", { name: "Try again" })).toBeVisible();
  // The first load has a skeleton that says what it is waiting for, once.
  await expect(states.locator('[role="status"]', { hasText: "Loading orders" }).first()).toHaveText(
    "Loading orders",
  );
});

test("the cursor pager walks forward and back with no page number", async ({ page }) => {
  await open(page, "light", "en");
  const paging = sectionOf(page, "data-table-paging");
  const grid = paging.getByRole("grid", { name: "Orders, paged" });
  const pager = paging.getByRole("navigation", { name: "Orders, paged pagination" });
  await expect(pager.getByRole("button", { name: "Previous" })).toBeDisabled();
  await pager.getByRole("button", { name: "Next" }).click();
  await expect(paging.getByTestId("data-table-cursor")).toHaveText("Cursor: 5");
  expect(await rowHeaders(grid)).toEqual(["#1006", "#1007", "#1008", "#1009", "#1010"]);
  await pager.getByRole("button", { name: "Previous" }).click();
  await expect(paging.getByTestId("data-table-cursor")).toHaveText("Cursor: 0");
});

test("the live table searches, shows a failed load and recovers", async ({ page }) => {
  await open(page, "light", "en");
  const live = sectionOf(page, "data-table-live");
  await expect(live.getByTestId("data-table-live-matching")).toHaveText("Matching: 24");
  await live.getByRole("searchbox", { name: "Search the live orders" }).fill("ada");
  await expect(live.getByTestId("data-table-live-matching")).toHaveText("Matching: 6");

  await live.getByRole("button", { name: "Simulate a failed load" }).click();
  await expect(live.getByRole("alert")).toContainText("The order service did not answer.");
  await expect(live.getByRole("grid", { name: "Orders, live" })).toHaveCount(0);
  await live.getByRole("button", { name: "Try again" }).click();
  await expect(live.getByRole("grid", { name: "Orders, live" })).toBeVisible();
});

test("a query change in the live table clears the selection and returns to the first page", async ({
  page,
}) => {
  await open(page, "light", "en");
  const live = sectionOf(page, "data-table-live");
  const grid = live.getByRole("grid", { name: "Orders, live" });
  await boxIn(grid.getByRole("row", { name: /#1001/ })).click();
  await expect(live.getByTestId("data-table-live-selected")).toHaveText("Selected: ord-1001");
  await live
    .getByRole("navigation", { name: "Orders, live pagination" })
    .getByRole("button", { name: "Next" })
    .click();
  await expect(grid.getByRole("rowheader").first()).toHaveText("#1006");
  await expect(live.getByTestId("data-table-live-selected")).toHaveText("Selected: none");
  await grid.getByRole("columnheader", { name: "Customer" }).click();
  await expect(grid.getByRole("rowheader").first()).toHaveText("#1001");
});

test("every press target of the table and the bar is at least 24 px square", async ({ page }) => {
  await open(page, "light", "en");
  const selection = sectionOf(page, "data-table-selection");
  const targets = [
    menuButton(sectionOf(page, "data-table-row-actions"), "#1001"),
    ...(await selection
      .getByRole("toolbar", { name: "Orders, several selected actions" })
      .getByRole("button")
      .all()),
    boxIn(
      selection
        .getByRole("grid", { name: "Orders, several selected" })
        .getByRole("row", { name: /#1001/ }),
    ),
  ];
  for (const target of targets) {
    const box = await target.boundingBox();
    if (!box) throw new Error("no box for a press target");
    expect(box.width).toBeGreaterThanOrEqual(24);
    expect(box.height).toBeGreaterThanOrEqual(24);
  }
});

for (const locale of LOCALES)
  test(`the first column sits at the reading-start side in ${locale}`, async ({ page }) => {
    await open(page, "light", locale);
    const headers = sectionOf(page, "data-table-basics")
      .getByRole("grid", { name: "Orders, primary variant" })
      .getByRole("columnheader");
    const first = await headers.nth(0).boundingBox();
    const second = await headers.nth(1).boundingBox();
    if (!first || !second) throw new Error("a box is missing");
    expect(first.x < second.x, locale).toBe(locale === "en");
  });
