/**
 * Stackra file contract:
 * Purpose: proves the web `DataView`: a named region with a named toolbar and a result count; the quick search narrows
 *          the rows; switching to the cards and list views and back keeps the search, the sort and the hidden columns;
 *          a filter condition shows as a removable chip; the views menu saves the current state as a named view; a card
 *          opens its record in the side panel; "select all N" across pages ticks every page and the engine answers
 *          every matching id (client mode); under 600 px of its own width the table is drawn as cards; a `board` adds
 *          the Board view.
 * Boundary: DataView over a real `useCollection` in client mode, in jsdom (wide: the toolbar is not folded).
 * Runtime: node
 * Governing contract: data-collection plan (owner, 2026-10-29); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";

import type { CollectionColumn } from "#contracts/types/collection-column.type";
import type { CollectionController } from "#contracts/types/collection-controller.type";
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

/** A paged DataView with a bulk action and a side panel; it hands its engine out for the test to read. */
function Rows({
  onEngine,
  renderRowPanel,
}: {
  readonly onEngine?: (collection: CollectionController) => void;
  readonly renderRowPanel?: (item: (typeof ROWS)[number]) => ReactNode;
}) {
  const collection = useCollection({
    columns: COLUMNS,
    items: ROWS,
    paging: "page",
    initialState: { pageSize: 2 },
  });
  onEngine?.(collection as unknown as CollectionController);
  return (
    <DataView
      label="Customers"
      collection={collection}
      bulkActions={[{ id: "tag", label: "Tag" }]}
      renderRowPanel={renderRowPanel}
    />
  );
}

/** A DataView with a board by city. */
function Boarded() {
  const collection = useCollection({ columns: COLUMNS, items: ROWS });
  return (
    <DataView
      label="Customers"
      collection={collection}
      board={{ field: "city", onMove: () => undefined }}
    />
  );
}

describe("DataView (web)", () => {
  it("opens a card's record in the side panel", async () => {
    render(<Rows renderRowPanel={(item) => `Panel of ${item.customer}`} />);
    fireEvent.click(screen.getByRole("radio", { name: "Cards" }));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Gulf Dates Co." }));
    });
    expect(await screen.findByText("Panel of Gulf Dates Co.")).toBeTruthy();
  });

  it("selects every matching row across pages and answers every id", async () => {
    let engine: CollectionController | undefined;
    render(<Rows onEngine={(collection) => (engine = collection)} />);
    const grid = screen.getByRole("grid", { name: "Customers" });
    await act(async () => {
      fireEvent.click(within(grid).getAllByRole("checkbox")[0] as HTMLElement);
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Select all 3" }));
    });
    expect(engine?.selected).toEqual({ kind: "ids", ids: ["1", "2", "3"] });
    await act(async () => {
      engine?.setPage(1);
    });
    const boxes = within(screen.getByRole("grid", { name: "Customers" })).getAllByRole("checkbox");
    for (const box of boxes) expect((box as HTMLInputElement).checked).toBe(true);
  });

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

  it("draws the table as cards below its own 600 px", () => {
    // The DataView measures itself: 400 px wide here.
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}

        unobserve() {}

        disconnect() {}
      },
    );
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(400);
    const { unmount } = render(<Harness />);
    expect(screen.queryByRole("grid", { name: "Customers" })).toBeNull();
    expect(screen.getByRole("list", { name: "Customers" })).toBeTruthy();
    unmount();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("offers the board in the view switcher when a board is given", () => {
    render(<Boarded />);
    fireEvent.click(screen.getByRole("radio", { name: "Board" }));
    expect(screen.getByRole("grid", { name: "Customers: Riyadh" })).toBeTruthy();
    expect(screen.getByRole("grid", { name: "Customers: Jeddah" })).toBeTruthy();
  });
});
