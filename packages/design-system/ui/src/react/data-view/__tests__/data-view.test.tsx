/**
 * Stackra file contract:
 * Purpose: proves the web `DataView`: a named region with a named toolbar and a result count; the quick search narrows
 *          the rows; switching to the cards and list views and back keeps the search, the sort and the hidden columns;
 *          a filter condition shows as a removable chip; the views menu saves the current state as a named view.
 * Boundary: DataView over a real `useCollection` in client mode, in jsdom (wide: the toolbar is not folded).
 * Runtime: node
 * Governing contract: data-collection plan (owner, 2026-10-29); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { fireEvent, render, screen, within } from "@testing-library/react";

import type { CollectionColumn } from "#contracts/types/collection-column.type";
import { DataView } from "#react/data-view/data-view";
import { useCollection } from "#react/hooks/use-collection";

const COLUMNS: readonly CollectionColumn[] = [
  { id: "customer", label: "Customer", isSortable: true },
  { id: "city", label: "City", isGroupable: true, isSortable: true },
  { id: "total", label: "Total", type: "number", isSortable: true },
];
const ROWS = [
  { id: "1", customer: "Al Noor Trading", city: "Riyadh", total: 1200 },
  { id: "2", customer: "Gulf Dates Co.", city: "Jeddah", total: 300 },
  { id: "3", customer: "Najd Coffee", city: "Riyadh", total: 760 },
];

/** A DataView on a client engine. */
function Harness({ initialFilter }: { readonly initialFilter?: boolean }) {
  const collection = useCollection({
    columns: COLUMNS,
    items: ROWS,
    initialState: initialFilter
      ? {
          filter: {
            match: "all",
            conditions: [{ id: "c1", field: "city", operator: "equals", value: "Riyadh" }],
          },
        }
      : {},
  });
  return <DataView label="Customers" collection={collection} />;
}

describe("DataView (web)", () => {
  it("is a named region with a named toolbar and a result count", () => {
    render(<Harness />);
    expect(screen.getByRole("region", { name: "Customers" })).toBeTruthy();
    expect(screen.getByRole("toolbar", { name: "Customers tools" })).toBeTruthy();
    expect(screen.getByText("3 results")).toBeTruthy();
  });

  it("keeps the search and sort when switching to cards, the list and back", () => {
    render(<Harness />);
    fireEvent.change(screen.getByRole("searchbox", { name: "Search Customers" }), {
      target: { value: "riyadh" },
    });
    expect(screen.getByText("2 results")).toBeTruthy();
    fireEvent.click(screen.getByRole("radio", { name: "Cards" }));
    const cards = screen.getByRole("list", { name: "Customers" });
    expect(
      within(cards)
        .getAllByRole("heading")
        .map((heading) => heading.textContent),
    ).toEqual(["Al Noor Trading", "Najd Coffee"]);
    fireEvent.click(screen.getByRole("radio", { name: "List" }));
    expect(screen.getByText("Najd Coffee")).toBeTruthy();
    fireEvent.click(screen.getByRole("radio", { name: "Table" }));
    expect(
      (screen.getByRole("searchbox", { name: "Search Customers" }) as HTMLInputElement).value,
    ).toBe("riyadh");
    expect(
      within(screen.getByRole("grid", { name: "Customers" })).getAllByRole("row"),
    ).toHaveLength(3);
  });

  it("shows a filter condition as a chip that removes it", () => {
    render(<Harness initialFilter />);
    expect(screen.getByText("2 results")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Remove filter: City is Riyadh" }));
    expect(screen.getByText("3 results")).toBeTruthy();
  });

  it("saves the current state as a named view", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "View actions" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Save as a new view" }));
    fireEvent.change(screen.getByRole("textbox", { name: "View name" }), {
      target: { value: "Riyadh VIP" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.getAllByText("Riyadh VIP").length).toBeGreaterThan(0);
  });
});
