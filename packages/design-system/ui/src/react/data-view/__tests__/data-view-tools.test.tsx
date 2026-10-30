/**
 * Stackra file contract:
 * Purpose: proves the web `DataView` toolbar beyond the basics: group and density menus reach the engine; refresh,
 *          export, import and full screen appear when asked; filter chips read a choice's label, leave out the value of
 *          an emptiness rule and remove a nested group; a narrow view folds the tools into drawers; a phone opens on the
 *          list; the grid view, a custom layout, and paged or infinite cards each render; server mode refreshes.
 * Boundary: DataView over a real `useCollection`, in jsdom; ResizeObserver, matchMedia and the Fullscreen API are
 *          stubbed per test.
 * Runtime: browser
 * Governing contract: data-collection plan (owner, 2026-10-29); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";

import type { CollectionColumn } from "#contracts/types/collection-column.type";
import type { UseCollectionOptions } from "#react/hooks/use-collection-options.type";
import { DataView } from "#react/data-view/data-view";
import type { DataViewProps } from "#react/data-view/data-view.props";
import { useCollection } from "#react/hooks/use-collection";

const press = (element: HTMLElement) => act(() => element.click());

const COLUMNS: readonly CollectionColumn[] = [
  { id: "customer", label: "Customer", isSortable: true },
  {
    id: "city",
    label: "City",
    isGroupable: true,
    type: "choice",
    options: [
      { id: "ruh", label: "Riyadh" },
      { id: "jed", label: "Jeddah" },
    ],
  },
  { id: "total", label: "Total", type: "number" },
];
const ROWS = Array.from({ length: 12 }, (_, index) => ({
  id: String(index),
  customer: `Customer ${index}`,
  city: index % 2 === 0 ? "ruh" : "jed",
  total: index * 10,
}));

type Row = (typeof ROWS)[number];

/** A DataView on an engine built from the given options. */
function Harness({
  options,
  view,
}: {
  readonly options?: Partial<UseCollectionOptions<Row>>;
  readonly view?: Partial<DataViewProps<Row>>;
}) {
  const collection = useCollection<Row>({ columns: COLUMNS, items: ROWS, ...options });
  return (
    <>
      <DataView label="Customers" collection={collection} {...view} />
      <output data-testid="state">
        {`${collection.state.groupBy ?? "-"}|${collection.state.density}|${collection.state.layout}`}
      </output>
    </>
  );
}

const state = () => screen.getByTestId("state").textContent;

describe("DataView tools (web)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("groups by a column and sets the density through their menus", () => {
    render(<Harness />);
    press(screen.getByRole("button", { name: "Group" }));
    press(screen.getByRole("menuitemradio", { name: "City" }));
    expect(state()).toBe("city|normal|table");
    expect(screen.getByRole("button", { name: "Group: City" })).toBeTruthy();
    press(screen.getByRole("button", { name: "Group: City" }));
    press(screen.getByRole("menuitemradio", { name: "No grouping" }));
    expect(state()).toBe("-|normal|table");
    press(screen.getByRole("button", { name: "Row density" }));
    press(screen.getByRole("menuitemradio", { name: "Compact" }));
    expect(state()).toBe("-|compact|table");
  });

  it("offers refresh, export, import and full screen when asked", () => {
    const onRefresh = vi.fn();
    const requestFullscreen = vi.fn(() => Promise.resolve());
    HTMLElement.prototype.requestFullscreen = requestFullscreen;
    render(
      <Harness
        options={{ initialState: { search: "1", selection: ["1"] } }}
        view={{
          onRefresh,
          exportOptions: { formats: [{ value: "csv", label: "CSV" }], onExport: () => undefined },
          importOptions: {
            fields: [{ key: "customer", label: "Customer" }],
            onRead: () => Promise.resolve({ columns: ["customer"] }),
            onDryRun: () => Promise.resolve({ created: 0, updated: 0, failed: 0, issues: [] }),
            onImport: () => Promise.resolve({ created: 0, updated: 0, failed: 0, issues: [] }),
          },
        }}
      />,
    );
    press(screen.getByRole("button", { name: "Refresh" }));
    expect(onRefresh).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Export" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Import" })).toBeTruthy();
    press(screen.getByRole("button", { name: "Full screen" }));
    expect(requestFullscreen).toHaveBeenCalled();
    const region = screen.getByRole("region", { name: "Customers" });
    Object.defineProperty(document, "fullscreenElement", { configurable: true, value: region });
    act(() => {
      document.dispatchEvent(new Event("fullscreenchange"));
    });
    const exit = vi.fn(() => Promise.resolve());
    document.exitFullscreen = exit;
    press(screen.getByRole("button", { name: "Exit full screen" }));
    expect(exit).toHaveBeenCalled();
    Object.defineProperty(document, "fullscreenElement", { configurable: true, value: null });
  });

  it("leaves full screen out when turned off", () => {
    render(<Harness view={{ hasFullscreen: false }} />);
    expect(screen.queryByRole("button", { name: "Full screen" })).toBeNull();
  });

  it("writes filter chips with a choice's label, no value for an emptiness rule, and removes a nested group", () => {
    render(
      <Harness
        options={{
          initialState: {
            filter: {
              match: "all",
              conditions: [
                { id: "a", field: "city", operator: "equals", value: "ruh" },
                { id: "b", field: "total", operator: "is_not_empty", value: "" },
              ],
              groups: [
                {
                  id: "g",
                  match: "any",
                  conditions: [{ id: "c", field: "customer", operator: "contains", value: "1" }],
                },
              ],
            },
          },
        }}
      />,
    );
    const chips = screen.getByRole("list", { name: "Filter" });
    expect(within(chips).getByText("City is Riyadh")).toBeTruthy();
    expect(within(chips).getByText("Total is not empty")).toBeTruthy();
    expect(within(chips).getByText("Group 1 (1)")).toBeTruthy();
    press(screen.getByRole("button", { name: "Remove filter: Group 1" }));
    expect(within(chips).queryByText("Group 1 (1)")).toBeNull();
  });

  it("folds the tools into drawers when narrow", () => {
    // jsdom lays nothing out, so the observed width is 0.
    class Narrow {
      observe() {}

      unobserve() {}

      disconnect() {}
    }
    vi.stubGlobal("ResizeObserver", Narrow);
    render(<Harness />);
    expect(screen.queryByRole("button", { name: "Row density" })).toBeNull();
    press(screen.getByRole("button", { name: "More tools" }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByRole("region", { name: "Sort" })).toBeTruthy();
    // A table this narrow reads as cards, which have no columns to arrange.
    expect(within(dialog).queryByRole("region", { name: "Arrange columns" })).toBeNull();
    press(within(dialog).getByRole("radio", { name: "Cards" }));
    expect(state()).toBe("-|normal|cards");
  });

  it("opens on the phone layout on a small screen", () => {
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: true,
      media: query,
      addEventListener() {},
      removeEventListener() {},
    }));
    render(<Harness view={{ phoneLayout: "cards" }} />);
    expect(state()).toBe("-|normal|cards");
  });

  it("shows the grid view when grid columns are given, and a custom layout when one is drawn", () => {
    const { unmount } = render(
      <Harness
        options={{ initialState: { layout: "grid" } }}
        view={{ gridColumns: [{ id: "customer", label: "Customer" }] }}
      />,
    );
    expect(screen.getByRole("radio", { name: "Grid" })).toBeTruthy();
    expect(screen.getByRole("region", { name: "Customers" }).getAttribute("data-layout")).toBe(
      "grid",
    );
    unmount();
    render(
      <Harness
        options={{ initialState: { layout: "board" } }}
        view={{ layouts: ["board"], renderLayout: { board: () => <p>Board here</p> } }}
      />,
    );
    expect(screen.getByText("Board here")).toBeTruthy();
    expect(screen.queryByRole("radiogroup", { name: "View as" })).toBeNull();
  });

  it("pages the cards and loads more of an infinite list", () => {
    const { unmount } = render(
      <Harness options={{ paging: "page", initialState: { layout: "cards", pageSize: 5 } }} />,
    );
    const nav = screen.getByRole("navigation", { name: "Page 1 of 3" });
    expect(
      within(nav).getByRole("button", { name: "Previous page" }).hasAttribute("disabled"),
    ).toBe(true);
    press(within(nav).getByRole("button", { name: "Next page" }));
    expect(screen.getByRole("navigation", { name: "Page 2 of 3" })).toBeTruthy();
    press(screen.getByRole("button", { name: "Previous page" }));
    expect(screen.getByRole("navigation", { name: "Page 1 of 3" })).toBeTruthy();
    unmount();
    render(
      <Harness options={{ paging: "infinite", initialState: { layout: "list", pageSize: 5 } }} />,
    );
    expect(screen.getAllByText(/^Customer \d+$/)).toHaveLength(5);
    press(screen.getByRole("button", { name: "Load more" }));
    expect(screen.getAllByText(/^Customer \d+$/)).toHaveLength(10);
  });

  it("refreshes a server collection from the toolbar", async () => {
    const fetch = vi.fn(() => Promise.resolve({ items: ROWS.slice(0, 2), totalCount: 2 }));
    render(<Harness options={{ mode: "server", fetch, items: [] }} />);
    await waitFor(() => expect(screen.getByText("2 results")).toBeTruthy());
    press(screen.getByRole("button", { name: "Refresh" }));
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
  });

  it("adds a filter rule from a column menu", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "Customer options" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Filter by this column" }));
    expect(screen.getByRole("button", { name: /^Remove filter: Customer contains/ })).toBeTruthy();
  });
});
