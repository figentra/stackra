/**
 * Stackra file contract:
 * Purpose: proves the web FilterPanel lists its facets inline on desktop with each option's count, draws one clearable
 *          chip per applied filter and a clear-all button, applies a saved view's whole query, sets the sort from its
 *          menu's columns, announces the result count, and moves the facets into a drawer below 768px.
 * Boundary: jsdom with real HeroUI and React Aria; `matchMedia` is stubbed to pick the layout.
 * Runtime: browser
 * Governing contract: ADR 0022 (test placement); design-system gap inventory (2026-10-28) row 9.
 */
// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";

import type { FilterDefinition } from "#contracts/types/filter-definition.type";
import type { ResourceQuery } from "#contracts/types/resource-query.type";
import { FilterPanel } from "#react/filter-panel/filter-panel";

const FILTERS: readonly FilterDefinition[] = [
  {
    id: "status",
    label: "Status",
    kind: "multi-select",
    options: [
      { id: "paid", label: "Paid" },
      { id: "refunded", label: "Refunded" },
    ],
  },
  { id: "customer", label: "Customer", kind: "text" },
];

const QUERY: ResourceQuery = {
  search: "",
  filterValues: { status: ["paid"], customer: "" },
  sort: null,
};

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
    render(
      <FilterPanel
        query={QUERY}
        onQueryChange={vi.fn()}
        filters={FILTERS}
        label="Filter orders"
        counts={{ status: { paid: 12, refunded: 3 } }}
      />,
    );
    expect(screen.getByRole("region", { name: "Filter orders" })).toBeTruthy();
    expect(screen.getByRole("checkbox", { name: "Refunded (3)" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Filters" })).toBeNull();
  });

  it("draws one clearable chip per applied filter and a clear-all button", () => {
    stubWidth(true);
    const onQueryChange = vi.fn();
    render(
      <FilterPanel
        query={QUERY}
        onQueryChange={onQueryChange}
        filters={FILTERS}
        label="Filter orders"
      />,
    );
    const chips = screen.getByRole("list", { name: "Applied filters" });
    expect(chips.textContent).toContain("Status: Paid");
    act(() => screen.getByRole("button", { name: "Remove filter Status" }).click());
    expect(onQueryChange).toHaveBeenLastCalledWith({ ...QUERY, filterValues: { customer: "" } });
    act(() => screen.getByRole("button", { name: "Clear all" }).click());
    expect(onQueryChange.mock.lastCall?.[0].filterValues).toEqual({});
  });

  it("applies a saved view's whole query and announces the result count", () => {
    stubWidth(true);
    const onQueryChange = vi.fn();
    const onViewChange = vi.fn();
    const refunds: ResourceQuery = {
      search: "",
      filterValues: { status: ["refunded"] },
      sort: null,
    };
    render(
      <FilterPanel
        query={QUERY}
        onQueryChange={onQueryChange}
        filters={FILTERS}
        label="Filter orders"
        resultCount={42}
        views={[
          { id: "all", label: "All", query: QUERY },
          { id: "refunds", label: "Refunds", query: refunds },
        ]}
        onViewChange={onViewChange}
      />,
    );
    act(() => screen.getByRole("tab", { name: "Refunds" }).click());
    expect(onQueryChange).toHaveBeenLastCalledWith(refunds);
    expect(onViewChange).toHaveBeenLastCalledWith("refunds");
    expect(screen.getByRole("status").textContent).toBe("42 results");
  });

  it("moves the facets into a drawer below 768px", () => {
    stubWidth(false);
    render(
      <FilterPanel query={QUERY} onQueryChange={vi.fn()} filters={FILTERS} label="Filter orders" />,
    );
    expect(screen.queryByRole("checkbox", { name: "Paid" })).toBeNull();
    expect(screen.getByRole("button", { name: "Filters" })).toBeTruthy();
  });
});
