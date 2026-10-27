/**
 * Stackra file contract:
 * Purpose: proves the table page titles the document, shows both variants with status chips and money in the cells,
 *          sorts the server-sorted table by the header press and reports it, shows the three selection modes with their
 *          reports, a sticky header, the empty, first-load and reload states with one status message each, and a live
 *          table that sorts, selects and resets.
 * Boundary: jsdom inside the DesignSystemProvider with stubbed matchMedia and IntersectionObserver (the load-more
 *           sentinel needs it); the theme CSS is not loaded, so the end of the rows is never reached here.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0303 (decision 7); ADR 0313; ADR 0022 (test placement).
 */
// @covers sta-350:FR-125
import { DesignSystemProvider } from "@stackra/ui/react";
import { act, render, screen, within } from "@testing-library/react";

import { Table } from "#src/routes/table/table";
import { TableRoute } from "#src/routes/table/table.route";

function renderPage() {
  render(
    <DesignSystemProvider colorScheme="light" locale="en">
      <Table />
    </DesignSystemProvider>,
  );
}

const section = (name: string) => within(screen.getByRole("region", { name }));
const press = (element: HTMLElement) => act(() => element.click());
const firstColumn = (table: HTMLElement) =>
  within(table)
    .getAllByRole("rowheader")
    .map((cell) => cell.textContent);

describe("Table page", () => {
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
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("titles the page and the document, and sits at /table under Data display", () => {
    renderPage();
    expect(TableRoute.path).toBe("/table");
    expect(TableRoute.category).toBe("Data display");
    expect(screen.getByRole("heading", { level: 1, name: "Table" })).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(document.title).toBe("Table · Stackra Playground");
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

  it("sorts as the header press asks, the page playing the server, and reports the sort", () => {
    renderPage();
    const sorting = section("Sorting");
    const table = sorting.getByRole("grid", { name: "Orders, sorted by the server" });
    expect(sorting.getByText("Sorted by: total, descending")).toBeTruthy();
    expect(firstColumn(table)).toEqual(["#1018", "#1013", "#1008", "#1003", "#1020", "#1015"]);

    press(within(table).getByRole("columnheader", { name: "Total" }));
    expect(sorting.getByText("Sorted by: total, ascending")).toBeTruthy();
    expect(firstColumn(table).slice(0, 3)).toEqual(["#1001", "#1023", "#1006"]);
    expect(
      within(table).getByRole("columnheader", { name: "Total" }).getAttribute("aria-sort"),
    ).toBe("ascending");
  });

  it("shows no selection, one selected row and several, each reporting its ids", () => {
    renderPage();
    const selection = section("Selection");
    const none = selection.getByRole("grid", { name: "Orders, no selection" });
    expect(within(none).queryAllByRole("checkbox")).toHaveLength(0);

    const single = selection.getByRole("grid", { name: "Orders, one selected" });
    press(within(single).getByRole("row", { name: /#1003/ }));
    expect(selection.getByTestId("table-selected-single").textContent).toBe("Selected: ord-1003");

    expect(selection.getByTestId("table-selected-multiple").textContent).toBe("Selected: ord-1002");
    const multiple = selection.getByRole("grid", { name: "Orders, several selected" });
    // The select-all box, then a box per row: the fourth is the third row's.
    press(within(multiple).getAllByRole("checkbox")[3] as HTMLElement);
    expect(selection.getByTestId("table-selected-multiple").textContent).toBe(
      "Selected: ord-1002, ord-1003",
    );
    press(within(multiple).getAllByRole("checkbox")[0] as HTMLElement);
    expect(selection.getByTestId("table-selected-multiple").textContent).toBe(
      "Selected: ord-1001, ord-1002, ord-1003, ord-1004, ord-1005",
    );
  });

  it("scrolls the rows inside a fixed height under a sticky header", () => {
    renderPage();
    const table = section("Sticky header").getByRole("grid", { name: "Orders, sticky header" });
    expect(
      table.closest<HTMLElement>('[data-slot="table-scroll-container"]')?.style.maxHeight,
    ).toBe("14rem");
    expect(within(table).getAllByRole("row")).toHaveLength(15);
    for (const header of within(table).getAllByRole("columnheader"))
      expect(header.classList.contains("sticky")).toBe(true);
  });

  it("shows the empty state, a first load and a reload, announcing a load once", () => {
    renderPage();
    const states = section("States");
    // With no rows the grid gives way to a group of the same name, which holds the message.
    expect(states.queryByRole("grid", { name: "Orders, empty" })).toBeNull();
    expect(
      within(states.getByRole("group", { name: "Orders, empty" })).getByText(
        "No orders match this filter.",
      ),
    ).toBeTruthy();

    const loading = states.getByRole("group", { name: "Orders, loading" });
    expect(within(loading).getByText("Loading orders")).toBeTruthy();
    expect(within(loading).queryByText("No orders match this filter.")).toBeNull();

    // With rows the grid stays, and the loading line sits after it in the same table.
    const reloading = states.getByRole("grid", { name: "Orders, reloading" });
    expect(within(reloading).getByText("#1001")).toBeTruthy();
    const reloadingTable = reloading.closest<HTMLElement>('[data-slot="table"]');
    expect(within(reloadingTable as HTMLElement).getAllByText("Loading orders")).toHaveLength(2);
    const messages = states
      .getAllByRole("status")
      .map((status) => status.textContent)
      .filter(Boolean);
    expect(messages).toEqual(["Loading orders", "Loading orders"]);
  });

  it("sorts, selects and resets the live table, reporting each", () => {
    renderPage();
    const live = section("Try it");
    const table = live.getByRole("grid", { name: "Orders, live" });
    expect(live.getByTestId("table-live-loaded").textContent).toBe("Loaded 8 of 24 orders");
    expect(live.getByTestId("table-live-sort").textContent).toBe("Sorted by: none");

    press(within(table).getByRole("columnheader", { name: "Customer" }));
    expect(live.getByTestId("table-live-sort").textContent).toBe("Sorted by: customer, ascending");

    press(within(table).getAllByRole("checkbox")[1] as HTMLElement);
    expect(live.getByTestId("table-live-selected").textContent).toMatch(/^Selected: ord-\d+$/);

    press(live.getByRole("button", { name: "Reset" }));
    expect(live.getByTestId("table-live-sort").textContent).toBe("Sorted by: none");
    expect(live.getByTestId("table-live-selected").textContent).toBe("Selected: none");
    expect(live.getByTestId("table-live-loaded").textContent).toBe("Loaded 8 of 24 orders");
  });
});
