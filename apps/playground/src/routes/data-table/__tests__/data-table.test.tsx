/**
 * Stackra file contract:
 * Purpose: proves the data table page titles the document, shows both variants with status chips and money in the
 *          cells, sorts through the query and reports it, lists a menu of actions on each row (a slow one that shows
 *          itself working, a failing one, and a refusal with its reason), shows the bulk bar for several selected rows
 *          with select all matching and a failing bulk action that leaves the selection, draws a search field in the
 *          filter bar slot that narrows the rows, shows the empty, no-results, first-load, reload and error states, pages
 *          by cursor, and runs a live table that searches, sorts, pages, selects and acts.
 * Boundary: jsdom inside the DesignSystemProvider with stubbed matchMedia and IntersectionObserver (the table's
 *           load-more sentinel needs it); the theme CSS is not loaded, so looks are not checked. The fake server's delays
 *           run on fake timers, which each test that needs them advances by hand.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0303 (decision 7); ADR 0313; ADR 0318; ADR 0022 (test placement).
 */
// @covers sta-350:FR-193
import { DesignSystemProvider } from "@stackra/ui/react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";

import { DataTable } from "#src/routes/data-table/data-table";
import { DataTableRoute } from "#src/routes/data-table/data-table.route";
import { routePath } from "#src/components/playground-pages/route-path.function";

function renderPage() {
  render(
    <DesignSystemProvider colorScheme="light" locale="en">
      <DataTable />
    </DesignSystemProvider>,
  );
}

const section = (name: string) => within(screen.getByRole("region", { name }));
const press = (element: HTMLElement) => act(() => element.click());
const advance = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));
const firstColumn = (table: HTMLElement) =>
  within(table)
    .getAllByRole("rowheader")
    .map((cell) => cell.textContent);
const checkboxOf = (table: HTMLElement, row: RegExp) =>
  within(within(table).getByRole("row", { name: row })).getByRole("checkbox");

describe("DataTable page", () => {
  beforeEach(() => {
    vi.stubGlobal("matchMedia", () => ({
      matches: false,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }));
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        observe() {}

        unobserve() {}

        disconnect() {}
      },
    );
    // jsdom has no layout, and the menu scrolls the focused item into view on a timer, which would throw late.
    Object.defineProperty(Element.prototype, "scrollTo", {
      value: () => undefined,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    Reflect.deleteProperty(Element.prototype, "scrollTo");
  });

  it("titles the page and the document, and sits at /data-table under Data display", () => {
    renderPage();
    expect(routePath(DataTableRoute)).toBe("/data-table");
    expect(DataTableRoute.category).toBe("Data display");
    expect(screen.getByRole("heading", { level: 1, name: "Data table" })).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(document.title).toBe("Data table · Stackra Playground");
  });

  it("shows both variants, with the status as a chip and the total as money", () => {
    renderPage();
    const basics = section("Basics");
    const primary = basics.getByRole("grid", { name: "Orders, primary variant" });
    const secondary = basics.getByRole("grid", { name: "Orders, secondary variant" });
    expect(primary.closest('[data-slot="table"]')?.classList.contains("table-root--primary")).toBe(
      true,
    );
    expect(
      secondary.closest('[data-slot="table"]')?.classList.contains("table-root--secondary"),
    ).toBe(true);
    expect(within(primary).getAllByText("Paid").length).toBeGreaterThan(0);
    expect(within(primary).getByText("$47.00")).toBeTruthy();
  });

  it("sorts through the query, the page playing the server, and reports the sort", () => {
    renderPage();
    const sorting = section("Sorting");
    const table = sorting.getByRole("grid", { name: "Orders, sorted by the server" });
    expect(sorting.getByText("Sorted by: total, descending")).toBeTruthy();
    expect(firstColumn(table)).toEqual(["#1018", "#1013", "#1008", "#1003", "#1020", "#1015"]);
    press(within(table).getByRole("columnheader", { name: "Total" }));
    expect(sorting.getByText("Sorted by: total, ascending")).toBeTruthy();
    expect(firstColumn(table).slice(0, 3)).toEqual(["#1001", "#1023", "#1006"]);
  });

  describe("row actions", () => {
    it("names each row's menu for the row and runs a quick action", () => {
      renderPage();
      const actions = section("Row actions");
      press(actions.getByRole("button", { name: "Actions for #1002" }));
      press(screen.getByRole("menuitem", { name: "Open" }));
      expect(actions.getByTestId("data-table-last-action").textContent).toBe(
        "Last action: Open #1002",
      );
    });

    it("shows a slow action working, then done", async () => {
      vi.useFakeTimers();
      renderPage();
      const actions = section("Row actions");
      press(actions.getByRole("button", { name: "Actions for #1002" }));
      press(screen.getByRole("menuitem", { name: "Archive" }));
      press(actions.getByRole("button", { name: "Actions for #1002" }));
      expect(screen.getByRole("menuitem", { name: /^Archive/ }).getAttribute("aria-disabled")).toBe(
        "true",
      );
      await advance(2_000);
      expect(actions.getByTestId("data-table-last-action").textContent).toBe(
        "Last action: Archive #1002 done",
      );
    });

    it("refuses Refund for an order that is not paid, with its reason", () => {
      renderPage();
      const actions = section("Row actions");
      // #1002 is Pending, #1001 is Paid.
      press(actions.getByRole("button", { name: "Actions for #1002" }));
      const refund = screen.getByRole("menuitem", { name: /^Refund/ });
      expect(refund.getAttribute("aria-disabled")).toBe("true");
      expect(within(refund).getByText("Only paid orders can be refunded")).toBeTruthy();
    });

    it("reports a failing action and carries on", async () => {
      vi.useFakeTimers();
      renderPage();
      const actions = section("Row actions");
      press(actions.getByRole("button", { name: "Actions for #1001" }));
      press(screen.getByRole("menuitem", { name: "Delete" }));
      await advance(500);
      expect(actions.getByTestId("data-table-last-action").textContent).toBe(
        "Last action: Delete #1001 failed",
      );
    });
  });

  describe("selection and the bulk bar", () => {
    it("shows the bar for the two rows selected at the start, with their ids", () => {
      renderPage();
      const selection = section("Selection and the bulk bar");
      expect(
        selection.getByRole("toolbar", { name: "Orders, several selected actions" }),
      ).toBeTruthy();
      expect(selection.getByTestId("data-table-selected").textContent).toBe(
        "Selected: ord-1001, ord-1002",
      );
    });

    it("offers all matching for a fully selected page, and chooses and releases it", () => {
      renderPage();
      const selection = section("Selection and the bulk bar");
      const table = selection.getByRole("grid", { name: "Orders, several selected" });
      for (const row of [/#1003/, /#1004/, /#1005/]) press(checkboxOf(table, row));
      expect(selection.getByTestId("data-table-selected").textContent).toBe(
        "Selected: ord-1001, ord-1002, ord-1003, ord-1004, ord-1005",
      );
      press(selection.getByRole("button", { name: "Select all 24" }));
      expect(selection.getByTestId("data-table-all-matching").textContent).toBe(
        "All matching: yes",
      );
      expect(selection.getByText("24 selected", { selector: "p" })).toBeTruthy();
      press(selection.getByRole("button", { name: "Select only the 5 shown" }));
      expect(selection.getByTestId("data-table-all-matching").textContent).toBe("All matching: no");
    });

    it("leaves the selection alone when a bulk action fails, and clears it when one succeeds", async () => {
      vi.useFakeTimers();
      renderPage();
      const selection = section("Selection and the bulk bar");
      press(selection.getByRole("button", { name: "Delete" }));
      await advance(500);
      expect(selection.getByTestId("data-table-bulk-action").textContent).toBe(
        "Last action: Delete failed",
      );
      expect(selection.getByTestId("data-table-selected").textContent).toBe(
        "Selected: ord-1001, ord-1002",
      );

      press(selection.getByRole("button", { name: "Archive" }));
      await advance(500);
      expect(selection.getByTestId("data-table-selected").textContent).toBe("Selected: none");
      expect(selection.queryByRole("toolbar")).toBeNull();
    });
  });

  it("narrows the rows from the search field in the filter bar slot", () => {
    renderPage();
    const slot = section("Filter bar slot");
    const table = slot.getByRole("grid", { name: "Orders, with a search above" });
    expect(within(table).getAllByRole("row")).toHaveLength(6);
    fireEvent.change(slot.getByRole("searchbox", { name: "Search the orders" }), {
      target: { value: "grace" },
    });
    expect(slot.getByTestId("data-table-slot-query").textContent).toBe("Search: grace");
    expect(firstColumn(table)).toEqual(["#1002", "#1006", "#1010", "#1014", "#1018"]);
  });

  it("shows the empty, no-results, first-load, reload and error states", () => {
    renderPage();
    const states = section("States");
    expect(states.getByText("Nothing here yet")).toBeTruthy();
    expect(states.getByText("No results")).toBeTruthy();
    expect(states.getByRole("button", { name: "Clear filters" })).toBeTruthy();
    expect(states.getAllByText("Loading orders").length).toBeGreaterThan(0);
    expect(states.getByRole("grid", { name: "Orders, reloading" })).toBeTruthy();
    expect(states.getByRole("alert")).toBeTruthy();
    expect(states.getByText("The order service did not answer.")).toBeTruthy();
    expect(states.getByRole("button", { name: "Try again" })).toBeTruthy();
  });

  it("pages by cursor, forward and back, with no page number", () => {
    renderPage();
    const paging = section("Cursor paging");
    expect(paging.getByTestId("data-table-cursor").textContent).toBe("Cursor: 0");
    press(paging.getByRole("button", { name: "Next" }));
    expect(paging.getByTestId("data-table-cursor").textContent).toBe("Cursor: 5");
    expect(firstColumn(paging.getByRole("grid", { name: "Orders, paged" }))).toEqual([
      "#1006",
      "#1007",
      "#1008",
      "#1009",
      "#1010",
    ]);
    press(paging.getByRole("button", { name: "Previous" }));
    expect(paging.getByTestId("data-table-cursor").textContent).toBe("Cursor: 0");
  });

  describe("the live table", () => {
    it("searches, returns to the first page and counts what matches", () => {
      renderPage();
      const live = section("Try it");
      expect(live.getByTestId("data-table-live-matching").textContent).toBe("Matching: 24");
      fireEvent.change(live.getByRole("searchbox", { name: "Search the live orders" }), {
        target: { value: "ada" },
      });
      expect(live.getByTestId("data-table-live-query").textContent).toContain("Search: ada");
      expect(live.getByTestId("data-table-live-matching").textContent).toBe("Matching: 6");
    });

    it("sorts from a header press and clears the selection when the query changes", () => {
      renderPage();
      const live = section("Try it");
      const table = live.getByRole("grid", { name: "Orders, live" });
      press(checkboxOf(table, /#1001/));
      expect(live.getByTestId("data-table-live-selected").textContent).toBe("Selected: ord-1001");
      press(within(table).getByRole("columnheader", { name: "Customer" }));
      expect(live.getByTestId("data-table-live-query").textContent).toContain(
        "Sorted by: customer, ascending",
      );
      expect(live.getByTestId("data-table-live-selected").textContent).toBe("Selected: none");
    });

    it("shows a failed load, and recovers", () => {
      renderPage();
      const live = section("Try it");
      press(live.getByRole("button", { name: "Simulate a failed load" }));
      expect(live.getByRole("alert")).toBeTruthy();
      press(live.getByRole("button", { name: "Try again" }));
      expect(live.getByRole("grid", { name: "Orders, live" })).toBeTruthy();
    });

    it("loads the next page behind a loading state", async () => {
      vi.useFakeTimers();
      renderPage();
      const live = section("Try it");
      press(live.getByRole("button", { name: "Next" }));
      expect(live.getByRole("grid", { name: "Orders, live" }).closest("[aria-busy]")).toBeTruthy();
      await advance(500);
      expect(firstColumn(live.getByRole("grid", { name: "Orders, live" }))[0]).toBe("#1006");
    });
  });
});
