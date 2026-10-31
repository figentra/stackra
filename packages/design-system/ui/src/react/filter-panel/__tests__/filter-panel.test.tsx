/**
 * Stackra file contract:
 * Purpose: proves the web FilterPanel on a `useCollection` engine lists one facet per filterable column inline on
 *          desktop with each option's count, writes a facet's change as one condition of the engine's filter, draws
 *          one clearable chip per applied filter and a clear-all button, announces the result count (the engine's by
 *          default), and moves the facets into a drawer below 768px.
 * Boundary: jsdom with real HeroUI and React Aria; `matchMedia` is stubbed to pick the layout.
 * Runtime: browser
 * Governing contract: ADR 0022 (test placement); ADR 0505 (one filter model); design-system gap inventory
 *          (2026-10-28) row 9.
 */
// @vitest-environment jsdom
import { act, render, screen, waitFor } from "@testing-library/react";
import { useEffect, type ReactNode } from "react";

import type { CollectionColumn } from "#contracts/types/collection-column.type";
import type { CollectionController } from "#contracts/types/collection-controller.type";
import type { FilterPanelProps } from "#react/filter-panel/filter-panel.props";
import { FilterPanel } from "#react/filter-panel/filter-panel";
import { useCollection } from "#react/hooks/use-collection";

const COLUMNS: readonly CollectionColumn[] = [
  {
    id: "status",
    label: "Status",
    type: "choice",
    options: [
      { id: "paid", label: "Paid" },
      { id: "refunded", label: "Refunded" },
    ],
  },
  { id: "customer", label: "Customer" },
];

const ROWS = [
  { id: "1", status: "paid", customer: "Ada" },
  { id: "2", status: "refunded", customer: "Grace" },
];

/** The engine the harness last drew. */
const latest = { collection: undefined as CollectionController | undefined };

/** An engine over two rows, paid ones filtered, with the panel on it. */
function Harness(props: Partial<FilterPanelProps>): ReactNode {
  const collection = useCollection({
    columns: COLUMNS,
    items: ROWS,
    initialState: {
      filter: {
        match: "all",
        conditions: [{ id: "filter:status", field: "status", operator: "in", value: ["paid"] }],
      },
    },
  });
  useEffect(() => {
    latest.collection = collection;
  });
  return <FilterPanel collection={collection} label="Filter orders" {...props} />;
}

/** Answers every media query with `matches`. */
function stubWidth(matches: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches,
    media: query,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }));
  // HeroUI's tab indicator measures its tab; jsdom has no ResizeObserver.
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}

      unobserve() {}

      disconnect() {}
    },
  );
}

describe("FilterPanel (web)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("lists the facets inline on desktop with each option's count", () => {
    stubWidth(true);
    render(<Harness counts={{ status: { paid: 12, refunded: 3 } }} />);
    expect(screen.getByRole("region", { name: "Filter orders" })).toBeTruthy();
    expect(screen.getByRole("checkbox", { name: "Refunded (3)" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Filters" })).toBeNull();
  });

  it("writes a facet's change as one condition of the engine's filter", () => {
    stubWidth(true);
    render(<Harness />);
    act(() => screen.getByRole("checkbox", { name: "Refunded" }).click());
    expect(latest.collection?.state.filter.conditions).toEqual([
      { id: "filter:status", field: "status", operator: "in", value: ["paid", "refunded"] },
    ]);
  });

  it("draws one clearable chip per applied filter and a clear-all button", () => {
    stubWidth(true);
    render(<Harness />);
    const chips = screen.getByRole("list", { name: "Applied filters" });
    expect(chips.textContent).toContain("Status: Paid");
    act(() => screen.getByRole("button", { name: "Remove filter Status" }).click());
    expect(latest.collection?.state.filter.conditions).toEqual([]);
  });

  it("clears every filter from clear-all", () => {
    stubWidth(true);
    render(<Harness />);
    act(() => screen.getByRole("button", { name: "Clear all" }).click());
    expect(latest.collection?.isFiltered).toBe(false);
  });

  it("announces the engine's result count, or the one given", async () => {
    stubWidth(true);
    const { rerender } = render(<Harness />);
    expect(screen.getByRole("status").textContent).toBe("1 result");
    rerender(<Harness resultCount={42} />);
    // The old count rolls out before it leaves.
    await waitFor(() => expect(screen.getByRole("status").textContent).toBe("42 results"));
  });

  it("moves the facets into a drawer below 768px", () => {
    stubWidth(false);
    render(<Harness />);
    expect(screen.queryByRole("checkbox", { name: "Paid" })).toBeNull();
    expect(screen.getByRole("button", { name: "Filters" })).toBeTruthy();
  });
});
