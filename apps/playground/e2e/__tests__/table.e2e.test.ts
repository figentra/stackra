/**
 * Stackra file contract:
 * Purpose: the table route's own end-to-end checks: axe finds nothing (violations or incomplete) in light, dark,
 *          left-to-right and right-to-left; each grid is named by its label with a header per column; a sortable header
 *          sorts by the pointer, Enter and Space and marks `aria-sort`, and the rows arrive in the order the page's
 *          server gave; a row is selected by the box, by Space and by the pointer in one, all and one modes; a sticky
 *          header stays at the top of its scroller while the rows scroll; a first load, a reload and an empty table say
 *          so; the live table loads its next page when the end of the rows is scrolled into view and stops when there is
 *          none; and the first column sits at the reading-start side in both directions.
 * Boundary: the production build under `vite preview`; Chromium only.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 5); ADR 0303 (decision 7); ADR 0313; ADR 0182 (test tiers); ADR 0022 (test
 *          placement); WCAG 2.2 SC 1.3.1, 2.1.1, 2.5.8, 4.1.2, 4.1.3.
 */
// @covers sta-350:FR-123 sta-350:FR-125 sta-350:SC-002 sta-350:SC-011
import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { pageTitle } from "../support/page-title.function";
import { example } from "../support/example.function";

const SCHEMES = ["light", "dark"] as const;
const LOCALES = ["en", "ar"] as const;
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

const open = async (page: Page, scheme: string, locale: string) => {
  await page.emulateMedia({ colorScheme: scheme as "light" | "dark", reducedMotion: "reduce" });
  await page.goto(`/table?scheme=${scheme}&locale=${locale}`);
  await expect(
    page.getByRole("heading", { level: 1, name: pageTitle("Table", locale) }),
  ).toBeVisible();
  // Every lazy demo mounted: one arriving mid-scan leaves heading-order unable to place its headings.
  await expect(page.locator("[data-demo-loading]")).toHaveCount(0);
};

/** The visible box of a selection checkbox inside a row or the header: the input itself is visually hidden. */
const boxIn = (scope: Locator) => scope.locator('[data-slot="checkbox-content"]');

/** The text of a grid's row-header cells, in row order. */
const rowHeaders = (grid: Locator) => grid.getByRole("rowheader").allTextContents();

for (const scheme of SCHEMES)
  for (const locale of LOCALES)
    test(`axe finds nothing on the table page in ${scheme}, ${locale}`, async ({ page }) => {
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

test("each grid is named by its label and has a header per column", async ({ page }) => {
  await open(page, "light", "en");
  const basics = example(page, "usage");
  const grid = basics.getByRole("grid", { name: "Orders, primary variant" });
  await expect(grid).toBeVisible();
  await expect(grid.getByRole("columnheader")).toHaveText([
    "Order",
    "Customer",
    "Status",
    "Total",
    "Placed",
  ]);
  await expect(grid.getByRole("row")).toHaveCount(6);
  await expect(basics.getByRole("grid", { name: "Orders, secondary variant" })).toBeVisible();
});

test("a press on a sortable header sorts by it and marks aria-sort", async ({ page }) => {
  await open(page, "light", "en");
  const sorting = example(page, "sorting");
  const grid = sorting.getByRole("grid", { name: "Orders, sorted by the server" });
  await expect(sorting.getByText("Sorted by: total, descending")).toBeVisible();
  expect(await rowHeaders(grid)).toEqual(["#1018", "#1013", "#1008", "#1003", "#1020", "#1015"]);
  await expect(grid.getByRole("columnheader", { name: "Total" })).toHaveAttribute(
    "aria-sort",
    "descending",
  );

  await grid.getByRole("columnheader", { name: "Total" }).click();
  await expect(sorting.getByText("Sorted by: total, ascending")).toBeVisible();
  await expect(grid.getByRole("columnheader", { name: "Total" })).toHaveAttribute(
    "aria-sort",
    "ascending",
  );
  await expect(grid.getByRole("rowheader").first()).toHaveText("#1001");

  await grid.getByRole("columnheader", { name: "Customer" }).click();
  await expect(sorting.getByText("Sorted by: customer, ascending")).toBeVisible();
  await expect(grid.getByRole("columnheader", { name: "Customer" })).toHaveAttribute(
    "aria-sort",
    "ascending",
  );
  await expect(grid.getByRole("columnheader", { name: "Total" })).toHaveAttribute(
    "aria-sort",
    "none",
  );
});

test("a sortable header sorts from the keyboard with Enter and Space, and a plain one does not", async ({
  page,
}) => {
  await open(page, "light", "en");
  const sorting = example(page, "sorting");
  const grid = sorting.getByRole("grid", { name: "Orders, sorted by the server" });
  await grid.getByRole("columnheader", { name: "Order" }).focus();
  await page.keyboard.press("Enter");
  await expect(sorting.getByText("Sorted by: order, ascending")).toBeVisible();
  await page.keyboard.press("Space");
  await expect(sorting.getByText("Sorted by: order, descending")).toBeVisible();

  await grid.getByRole("columnheader", { name: "Status" }).focus();
  await page.keyboard.press("Enter");
  await expect(sorting.getByText("Sorted by: order, descending")).toBeVisible();
});

test("several rows are selected by their boxes and by Space, and select-all selects every row", async ({
  page,
}) => {
  await open(page, "light", "en");
  const selection = example(page, "selection");
  const grid = selection.getByRole("grid", { name: "Orders, several selected" });
  const selected = selection.getByTestId("table-selected-multiple");
  await expect(selected).toHaveText("Selected: ord-1002");
  await expect(grid.getByRole("row", { name: /#1002/ })).toHaveAttribute("aria-selected", "true");

  await boxIn(grid.getByRole("row", { name: /#1004/ })).click();
  await expect(selected).toHaveText("Selected: ord-1002, ord-1004");

  await grid.getByRole("row", { name: /#1001/ }).focus();
  await page.keyboard.press("Space");
  await expect(selected).toHaveText("Selected: ord-1001, ord-1002, ord-1004");
  await page.keyboard.press("Space");
  await expect(selected).toHaveText("Selected: ord-1002, ord-1004");

  await boxIn(grid.getByRole("columnheader").first()).click();
  await expect(selected).toHaveText("Selected: ord-1001, ord-1002, ord-1003, ord-1004, ord-1005");
  await boxIn(grid.getByRole("columnheader").first()).click();
  await expect(selected).toHaveText("Selected: none");
});

test("one row is selected by a press or Space, and the selection replaces the last", async ({
  page,
}) => {
  await open(page, "light", "en");
  const selection = example(page, "selection");
  const grid = selection.getByRole("grid", { name: "Orders, one selected" });
  const selected = selection.getByTestId("table-selected-single");
  await expect(grid.getByRole("checkbox")).toHaveCount(0);

  await grid.getByRole("row", { name: /#1003/ }).click();
  await expect(selected).toHaveText("Selected: ord-1003");
  // A press lands focus on the cell it hit; the arrow keys move it a row down and the selection follows it.
  await page.keyboard.press("ArrowDown");
  await expect(grid.locator("td:focus")).toHaveAttribute("data-key", "ord-1004:status");
  await expect(selected).toHaveText("Selected: ord-1004");
  await expect(grid.locator('[aria-selected="true"]')).toHaveCount(1);
  // Space on the selected row clears it, as a single selection may be empty, and selects it again.
  await page.keyboard.press("Space");
  await expect(selected).toHaveText("Selected: none");
  await page.keyboard.press("Space");
  await expect(selected).toHaveText("Selected: ord-1004");
  await expect(grid.locator('[aria-selected="true"]')).toHaveCount(1);

  const none = selection.getByRole("grid", { name: "Orders, no selection" });
  await none.getByRole("row", { name: /#1001/ }).click();
  await expect(none.locator('[aria-selected="true"]')).toHaveCount(0);
});

test("a sticky header stays at the top of its scroller while the rows scroll", async ({ page }) => {
  await open(page, "light", "en");
  const sticky = example(page, "sticky");
  const scroller = sticky.locator('[data-slot="table-scroll-container"]');
  const header = sticky.getByRole("columnheader").first();
  await scroller.evaluate((element) => {
    element.scrollTop = 120;
  });
  expect(await scroller.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  const box = await scroller.boundingBox();
  const headerBox = await header.boundingBox();
  if (!box || !headerBox) throw new Error("a box is missing");
  expect(Math.abs(headerBox.y - box.y)).toBeLessThan(2);
});

test("an empty table says why, and a load is announced once through one status", async ({
  page,
}) => {
  await open(page, "light", "en");
  const states = example(page, "states");
  // With no rows the grid gives way to a group of the same name, which holds the message.
  await expect(states.getByRole("grid", { name: "Orders, empty" })).toHaveCount(0);
  await expect(
    states.getByRole("group", { name: "Orders, empty" }).getByText("No orders match this filter."),
  ).toBeVisible();

  const loading = states.getByRole("group", { name: "Orders, loading" });
  await expect(loading.getByText("Loading orders")).toBeVisible();
  await expect(loading.getByText("No orders match this filter.")).toHaveCount(0);

  // With rows the grid stays, and the loading line sits after it in the same table.
  const reloading = states
    .locator('[data-slot="table"]')
    .filter({ has: page.getByRole("grid", { name: "Orders, reloading" }) });
  await expect(reloading.getByRole("rowheader", { name: "#1001" })).toBeVisible();
  await expect(reloading.getByText("Loading orders").first()).toBeVisible();

  const messages = states.locator('div[role="status"]');
  await expect(messages).toHaveText(["", "Loading orders", "Loading orders"]);
});

test("the live table loads its next page at the end of the rows, and stops at the last", async ({
  page,
}) => {
  await open(page, "light", "en");
  const live = example(page, "live");
  const loaded = live.getByTestId("table-live-loaded");
  const scroller = live.locator('[data-slot="table-scroll-container"]');
  const toEnd = () =>
    scroller.evaluate((element) => {
      element.scrollTop = element.scrollHeight;
    });
  await expect(loaded).toHaveText("Loaded 8 of 24 orders");

  await toEnd();
  await expect(loaded).toHaveText("Loaded 16 of 24 orders");
  await toEnd();
  await expect(loaded).toHaveText("Loaded 24 of 24 orders");
  // No more pages: the sentinel is gone, so reaching the end asks for nothing.
  await expect(live.locator('[data-testid="loadMoreSentinel"]')).toHaveCount(0);
  await toEnd();
  await expect(loaded).toHaveText("Loaded 24 of 24 orders");
});

test("the live table sorts from its first page, keeps its selection and resets", async ({
  page,
}) => {
  await open(page, "light", "en");
  const live = example(page, "live");
  const grid = live.getByRole("grid", { name: "Orders, live" });
  await boxIn(grid.getByRole("row", { name: /#1002/ })).click();
  await expect(live.getByTestId("table-live-selected")).toHaveText("Selected: ord-1002");

  await grid.getByRole("columnheader", { name: "Total" }).click();
  await expect(live.getByTestId("table-live-sort")).toHaveText("Sorted by: total, ascending");
  await expect(live.getByTestId("table-live-loaded")).toHaveText("Loaded 8 of 24 orders");
  await expect(grid.getByRole("rowheader").first()).toHaveText("#1001");
  await expect(live.getByTestId("table-live-selected")).toHaveText("Selected: ord-1002");

  await live.getByRole("button", { name: "Reset" }).click();
  await expect(live.getByTestId("table-live-sort")).toHaveText("Sorted by: none");
  await expect(live.getByTestId("table-live-selected")).toHaveText("Selected: none");
});

test("a row's checkbox target is at least 24 px square", async ({ page }) => {
  await open(page, "light", "en");
  const grid = example(page, "selection").getByRole("grid", { name: "Orders, several selected" });
  const box = await boxIn(grid.getByRole("row", { name: /#1001/ })).boundingBox();
  if (!box) throw new Error("no box for the checkbox");
  expect(box.width).toBeGreaterThanOrEqual(24);
  expect(box.height).toBeGreaterThanOrEqual(24);
});

for (const locale of LOCALES)
  test(`the first column sits at the reading-start side in ${locale}`, async ({ page }) => {
    await open(page, "light", locale);
    // The demo speaks the page's language (`assets/lang/<locale>/table.json`).
    const headers = example(page, "usage")
      .getByRole("grid", {
        name: locale === "en" ? "Orders, primary variant" : "الطلبات، النمط الأساسي",
      })
      .getByRole("columnheader");
    const first = await headers.nth(0).boundingBox();
    const second = await headers.nth(1).boundingBox();
    if (!first || !second) throw new Error("a box is missing");
    expect(first.x < second.x, locale).toBe(locale === "en");
  });
