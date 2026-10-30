/**
 * Stackra file contract:
 * Purpose: proves the web DataTable's column tools on the collection engine: a header menu per column whose items move,
 *          pin, hide, group and sort the column; a pinned column sticks at its offset; the keyboard resize ("Resize
 *          column", then the arrows and Enter) reports the new width; density reaches the table; and the legacy props
 *          (`hiddenColumns`, `query.sort`) still drive it.
 * Boundary: the DataTable over a real `useCollection`; widths are read from the engine.
 * Runtime: node
 * Governing contract: data-collection plan (owner, 2026-10-29); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen, within } from "@testing-library/react";

import type { CollectionColumn } from "#contracts/types/collection-column.type";
import type { ResourceQuery } from "#contracts/types/resource-query.type";
import { DataTable } from "#react/data-table/data-table";
import { useCollection } from "#react/hooks/use-collection";

const COLUMNS: readonly CollectionColumn[] = [
  { id: "order", label: "Order", isSortable: true },
  { id: "city", label: "City", isGroupable: true, isSortable: true },
  { id: "total", label: "Total", type: "number", isSortable: true, width: 120 },
];
const ROWS = [
  { id: "1", order: "#1001", city: "Riyadh", total: 40 },
  { id: "2", order: "#1002", city: "Jeddah", total: 10 },
  { id: "3", order: "#1003", city: "Riyadh", total: 25 },
];
const QUERY: ResourceQuery = { search: "", filterValues: {}, sort: null };

/** A DataTable on an engine, with a readout of the engine's state. */
function Harness() {
  const collection = useCollection({ columns: COLUMNS, items: ROWS });
  return (
    <>
      <DataTable
        label="Orders"
        items={collection.rows}
        columns={COLUMNS}
        collection={collection}
        hasColumnTools
        query={QUERY}
        onQueryChange={() => {}}
      />
      <output data-testid="state">
        {JSON.stringify({
          order: collection.columns.map(
            (column) =>
              `${column.id}${column.pin ? `:${column.pin}` : ""}${column.isHidden ? ":hidden" : ""}`,
          ),
          sort: collection.state.sort,
          groupBy: collection.state.groupBy,
          width: collection.columns.find((column) => column.id === "total")?.width,
        })}
      </output>
    </>
  );
}

const state = () =>
  JSON.parse(screen.getByTestId("state").textContent ?? "{}") as Record<string, unknown>;

/** Chooses an item of a column's menu. */
function choose(column: string, item: string) {
  fireEvent.click(screen.getByRole("button", { name: `${column} options` }));
  fireEvent.click(screen.getByRole("menuitem", { name: item }));
}

describe("DataTable column tools (web)", () => {
  it("gives every header a named menu", () => {
    render(<Harness />);
    for (const name of ["Order", "City", "Total"])
      expect(screen.getByRole("button", { name: `${name} options` })).toBeTruthy();
  });

  it("moves, pins and hides a column from its menu", () => {
    render(<Harness />);
    choose("Order", "Move towards end");
    expect(state()["order"]).toEqual(["city", "order", "total"]);
    choose("Total", "Pin to start");
    expect(state()["order"]).toEqual(["total:start", "city", "order"]);
    const header = screen.getAllByRole("columnheader")[0] as HTMLElement;
    expect(header.style.position).toBe("sticky");
    choose("City", "Hide column");
    expect(state()["order"]).toEqual(["total:start", "city:hidden", "order"]);
    expect(screen.queryByRole("columnheader", { name: /City/ })).toBeNull();
  });

  it("sorts, adds a sort key and groups from the menus", () => {
    render(<Harness />);
    choose("Total", "Sort descending");
    choose("Order", "Add to sort");
    expect(state()["sort"]).toEqual([
      { column: "total", direction: "descending" },
      { column: "order", direction: "ascending" },
    ]);
    const cells = screen.getAllByRole("rowheader").map((cell) => cell.textContent);
    expect(cells[0]).toContain("#1001");
    choose("City", "Group by this column");
    expect(state()["groupBy"]).toBe("city");
    expect(screen.getByText(/Riyadh · 2 rows/)).toBeTruthy();
  });

  it("resizes a column from the keyboard: Resize column, the arrows, then Enter", async () => {
    render(<Harness />);
    choose("Total", "Resize column");
    await act(async () => {
      await new Promise((resolve) => {
        setTimeout(resolve, 400);
      });
    });
    // React Aria's resizer is a hidden slider; "Resize column" starts it, and its arrows step the width.
    const input = screen.getByLabelText(/^Resize Total/) as HTMLInputElement;
    act(() => input.focus());
    fireEvent.keyDown(input, { key: "ArrowRight" });
    fireEvent.keyUp(input, { key: "ArrowRight" });
    fireEvent.keyDown(input, { key: "Enter" });
    fireEvent.keyUp(input, { key: "Enter" });
    await act(async () => {});
    expect(state()["width"]).toBeGreaterThan(120);
  });

  it("still takes the app's hidden columns and sort without an engine of its own", () => {
    const onQueryChange = vi.fn();
    render(
      <DataTable
        label="Orders"
        items={ROWS}
        columns={COLUMNS}
        hiddenColumns={["city"]}
        query={{ ...QUERY, sort: { column: "total", direction: "ascending" } }}
        onQueryChange={onQueryChange}
        density="compact"
      />,
    );
    const grid = screen.getByRole("grid", { name: "Orders" });
    expect(
      within(grid)
        .getAllByRole("columnheader")
        .map((cell) => cell.textContent),
    ).toEqual(["Order", "Total"]);
    expect(
      within(grid).getByRole("columnheader", { name: /Total/ }).getAttribute("aria-sort"),
    ).toBe("ascending");
    fireEvent.click(within(grid).getByRole("columnheader", { name: /Order/ }));
    expect(onQueryChange).toHaveBeenCalledWith({
      ...QUERY,
      sort: { column: "order", direction: "ascending" },
    });
  });
});
