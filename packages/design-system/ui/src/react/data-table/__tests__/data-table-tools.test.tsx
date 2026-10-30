/**
 * Stackra file contract:
 * Purpose: proves the web DataTable's group-by heading rows (with count and aggregates), its total row and hidden
 *          columns, and that SavedViews applies a view's query and toggles a facet chip.
 * Boundary: jsdom with real HeroUI.
 * Runtime: browser
 * Governing contract: product audit 2026-10-28 (DataTable variants); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";

import type { ResourceQuery } from "#contracts/types/resource-query.type";
import { DataTable } from "#react/data-table/data-table";
import { SavedViews } from "#react/saved-views/saved-views";

const QUERY: ResourceQuery = { search: "", filterValues: {}, sort: null };
const ITEMS = [
  { id: "1", name: "Latte", status: "Paid", total: 4 },
  { id: "2", name: "Mocha", status: "Due", total: 5 },
  { id: "3", name: "Tea", status: "Paid", total: 2 },
];
const COLUMNS = [
  { id: "name", label: "Name" },
  { id: "status", label: "Status" },
  { id: "total", label: "Total", align: "end" as const },
];

describe("DataTable tools (web)", () => {
  it("groups rows under heading rows with counts and sums, ends with a total and hides columns", () => {
    render(
      <DataTable
        label="Orders"
        items={ITEMS}
        columns={COLUMNS}
        query={QUERY}
        onQueryChange={vi.fn()}
        groupBy="status"
        aggregates={{ total: "sum" }}
        hiddenColumns={["status", "name"]}
      />,
    );
    const rows = screen.getAllByRole("row").map((row) => row.textContent ?? "");
    expect(rows.some((row) => row.startsWith("Paid · 2 rows") && row.endsWith("6"))).toBe(true);
    expect(rows.at(-1)).toContain("11");
    expect(screen.queryByRole("columnheader", { name: "Status" })).toBeNull();
    expect(screen.getByRole("columnheader", { name: "Name" })).toBeTruthy();
  });

  it("names an aggregate that is not a sum in its own column's cell, whatever the column's type", () => {
    render(
      <DataTable
        label="Orders"
        items={ITEMS}
        columns={COLUMNS}
        query={QUERY}
        onQueryChange={vi.fn()}
        aggregates={{ total: "avg", status: "count" }}
      />,
    );
    const cells = [...(screen.getAllByRole("row").at(-1)?.querySelectorAll("td, th") ?? [])].map(
      (cell) => cell.textContent,
    );
    expect(cells).toEqual(["Total", "Count3", "Average3.67"]);
  });
  it("applies a saved view and toggles a facet chip", () => {
    const onQueryChange = vi.fn();
    const unpaid: ResourceQuery = { ...QUERY, filterValues: { status: ["due"] } };
    render(
      <SavedViews
        label="Views"
        views={[{ id: "unpaid", label: "Unpaid", query: unpaid }]}
        query={QUERY}
        onQueryChange={onQueryChange}
        facetFilterId="status"
        facetLabel="Status"
        facets={[{ id: "paid", label: "Paid", count: 2 }]}
        onSaveView={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText("Unpaid"));
    expect(onQueryChange).toHaveBeenLastCalledWith(unpaid);
    fireEvent.click(screen.getByText("Paid (2)"));
    expect(onQueryChange).toHaveBeenLastCalledWith({
      ...QUERY,
      filterValues: { status: ["paid"] },
    });
    expect(screen.getByRole("button", { name: /save view/i })).toBeTruthy();
  });
});
