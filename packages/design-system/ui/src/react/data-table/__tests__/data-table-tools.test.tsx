/**
 * Stackra file contract:
 * Purpose: proves the web DataTable's group-by heading rows (with count and aggregates), its total row and hidden
 *          columns, all from the engine's state.
 * Boundary: jsdom with real HeroUI.
 * Runtime: browser
 * Governing contract: product audit 2026-10-28 (DataTable variants); ADR 0505; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";

import type { CollectionColumn } from "#contracts/types/collection-column.type";
import type { CollectionState } from "#contracts/types/collection-state.type";
import { DataTable } from "#react/data-table/data-table";
import { useCollection } from "#react/hooks/use-collection";

const ITEMS = [
  { id: "1", name: "Latte", status: "Paid", total: 4 },
  { id: "2", name: "Mocha", status: "Due", total: 5 },
  { id: "3", name: "Tea", status: "Paid", total: 2 },
];
const COLUMNS: readonly CollectionColumn[] = [
  { id: "name", label: "Name" },
  { id: "status", label: "Status" },
  { id: "total", label: "Total", align: "end", type: "number" },
];

/** A table over an engine that starts from `initialState`. */
function Table({ initialState }: { readonly initialState: Partial<CollectionState> }) {
  const collection = useCollection({ columns: COLUMNS, items: ITEMS, initialState });
  return <DataTable label="Orders" collection={collection} />;
}

describe("DataTable tools (web)", () => {
  it("groups rows under heading rows with counts and sums, ends with a total and hides columns", () => {
    render(
      <Table
        initialState={{
          groupBy: "status",
          aggregates: { total: "sum" },
          columns: [
            { id: "name", isHidden: true },
            { id: "status", isHidden: true },
            { id: "total" },
          ],
        }}
      />,
    );
    const rows = screen.getAllByRole("row").map((row) => row.textContent ?? "");
    expect(rows.some((row) => row.startsWith("Paid · 2 rows") && row.endsWith("6"))).toBe(true);
    expect(rows.at(-1)).toContain("11");
    expect(screen.queryByRole("columnheader", { name: "Status" })).toBeNull();
    expect(screen.getByRole("columnheader", { name: "Name" })).toBeTruthy();
  });

  it("names an aggregate that is not a sum in its own column's cell, whatever the column's type", () => {
    render(<Table initialState={{ aggregates: { total: "avg", status: "count" } }} />);
    const cells = [...(screen.getAllByRole("row").at(-1)?.querySelectorAll("td, th") ?? [])].map(
      (cell) => cell.textContent,
    );
    expect(cells).toEqual(["Total", "Count3", "Average3.67"]);
  });
});
