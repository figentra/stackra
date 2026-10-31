/**
 * Stackra file contract:
 * Purpose: proves the web DataTable names its grid by `label` and draws the rows and columns of the Table it composes
 *          from a `useCollection` engine (the app's, or its own over the shorthand `items` and `columns`), sorts through
 *          the engine on a header press, lists `rowActions` in a menu named for the row and runs one once while showing
 *          it pending, draws the `filterBar` slot above the rows, shows the bulk bar only while several rows are
 *          selected with the count and "select all N" for a fully selected page (keeping the choice, less the row, when
 *          a row is unticked), clears the selection and moves focus to its container, chooses the `no-results` empty
 *          state when the search or filter narrows and the `no-data` one otherwise (with a clear-filters button that
 *          keeps the sort), shows a named skeleton for a first load and keeps the rows with a loading line for a
 *          reload, shows an error state with a retry in place of the rows, draws the engine's pager (and none under a
 *          DataView, which owns it), passes the root's other props through, and refuses the names the contract dropped.
 * Boundary: jsdom with real HeroUI and React Aria; the theme CSS is not loaded, so classes are checked, not looks.
 *           jsdom has no IntersectionObserver, which the table's load-more sentinel needs, so a stand-in is installed.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0313; ADR 0505 (one data family); ADR 0022
 *          (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-188 sta-350:FR-189 sta-350:FR-192
import { defineIconRegistry } from "@stackra/icons";
import { IconRegistryProvider } from "@stackra/icons/react";
import { act, render, screen, within } from "@testing-library/react";
import { ChevronLeft, ChevronRight, Ellipsis } from "lucide-react";
import { useEffect, type ReactElement } from "react";

import type { CollectionColumn } from "#contracts/types/collection-column.type";
import type { CollectionController } from "#contracts/types/collection-controller.type";
import type { DataTableContractProps } from "#contracts/types/data-table-contract-props.type";
import { CollectionPagerContext } from "#react/data-table/collection-pager-context";
import { DataTable } from "#react/data-table/data-table";
import type { DataTableProps } from "#react/data-table/data-table.props";
import { useCollection } from "#react/hooks/use-collection";
import type { UseCollectionOptions } from "#react/hooks/use-collection-options.type";

const press = (element: HTMLElement) => act(() => element.click());

interface Order {
  readonly id: string;
  readonly number: string;
  readonly customer: string;
}

const ORDERS: readonly Order[] = [
  { id: "o1", number: "#1001", customer: "Ada" },
  { id: "o2", number: "#1002", customer: "Grace" },
  { id: "o3", number: "#1003", customer: "Linus" },
];

const COLUMNS: readonly CollectionColumn[] = [
  { id: "number", label: "Order", isSortable: true },
  { id: "customer", label: "Customer", isSortable: true },
];

const icons = defineIconRegistry({
  ellipsis: Ellipsis,
  "chevron-left": ChevronLeft,
  "chevron-right": ChevronRight,
});

/** The props every test starts from (the shorthand); each test adds what it is about. */
const baseProps = {
  label: "Orders",
  items: ORDERS,
  columns: COLUMNS,
} satisfies DataTableProps<Order>;

const draw = (ui: ReactElement) =>
  render(<IconRegistryProvider registry={icons}>{ui}</IconRegistryProvider>);

/** The engine the last `Engine` drew from, for the tests to read. */
const seen: { current: CollectionController<Order> | undefined } = { current: undefined };

/** A table over an engine the test configures, the way an app does. */
function Engine({
  options,
  ...props
}: Partial<DataTableProps<Order>> & {
  readonly options?: Partial<UseCollectionOptions<Order>>;
}) {
  const collection = useCollection<Order>({ columns: COLUMNS, items: ORDERS, ...options });
  useEffect(() => {
    seen.current = collection;
  });
  return <DataTable label="Orders" {...props} collection={collection} />;
}

const customerHeader = () => screen.getByRole("columnheader", { name: "Customer" });

const pager = (name: string) => screen.getByRole("navigation", { name });

const rowTexts = () =>
  screen
    .getAllByRole("row")
    .slice(1)
    .map((row) => row.textContent);

describe("DataTable (web)", () => {
  beforeEach(() => {
    seen.current = undefined;
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

  it("names its grid by the label and draws a header per column and a row per item", () => {
    draw(<DataTable {...baseProps} />);
    const grid = screen.getByRole("grid", { name: "Orders" });
    expect(
      within(grid)
        .getAllByRole("columnheader")
        .map((header) => header.textContent),
    ).toEqual(["Order", "Customer"]);
    expect(within(grid).getAllByRole("row")).toHaveLength(1 + ORDERS.length);
  });

  it("sorts through the engine: a header press marks the header and orders the rows", () => {
    draw(<DataTable {...baseProps} />);
    press(customerHeader());
    expect(customerHeader().getAttribute("aria-sort")).toBe("ascending");
    press(customerHeader());
    expect(customerHeader().getAttribute("aria-sort")).toBe("descending");
    expect(rowTexts()[0]).toContain("Linus");
  });

  it("marks the sorted header from the app's engine and writes a header press back to it", () => {
    draw(
      <Engine
        options={{ initialState: { sort: [{ column: "customer", direction: "ascending" }] } }}
      />,
    );
    expect(screen.getByRole("columnheader", { name: "Customer" }).getAttribute("aria-sort")).toBe(
      "ascending",
    );
    press(screen.getByRole("columnheader", { name: "Order" }));
    expect(seen.current?.state.sort).toEqual([{ column: "number", direction: "ascending" }]);
  });

  it("draws the filterBar slot above the rows", () => {
    draw(<DataTable {...baseProps} filterBar={<div data-testid="filters">Filters</div>} />);
    const filters = screen.getByTestId("filters");
    const grid = screen.getByRole("grid", { name: "Orders" });
    expect(filters.compareDocumentPosition(grid) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  describe("row actions", () => {
    it("adds an actions column with a menu named for the row's header cell", () => {
      draw(
        <DataTable
          {...baseProps}
          rowActions={(order) => [{ id: "open", label: `Open ${order.number}` }]}
        />,
      );
      const grid = screen.getByRole("grid", { name: "Orders" });
      expect(within(grid).getByRole("columnheader", { name: "Actions" })).toBeTruthy();
      press(screen.getByRole("button", { name: "Actions for #1002" }));
      expect(screen.getByRole("menuitem", { name: "Open #1002" })).toBeTruthy();
    });

    it("draws no column when no row has an action, and no menu for a row that has none", () => {
      const { rerender } = draw(<DataTable {...baseProps} />);
      expect(screen.queryByRole("columnheader", { name: "Actions" })).toBeNull();
      rerender(
        <IconRegistryProvider registry={icons}>
          <DataTable
            {...baseProps}
            rowActions={(order) => (order.id === "o1" ? [{ id: "open", label: "Open" }] : [])}
          />
        </IconRegistryProvider>,
      );
      expect(screen.getAllByRole("button", { name: /^Actions for/ })).toHaveLength(1);
    });

    it("runs an action that closes over its row, once, and shows it pending until it settles", async () => {
      let settle: (() => void) | undefined;
      const onPress = vi.fn(
        (_id: string) =>
          new Promise<void>((resolve) => {
            settle = resolve;
          }),
      );
      draw(
        <DataTable
          {...baseProps}
          rowActions={(order) => [
            { id: "archive", label: "Archive", onPress: () => onPress(order.id) },
          ]}
        />,
      );
      const open = () => press(screen.getByRole("button", { name: "Actions for #1002" }));
      open();
      press(screen.getByRole("menuitem", { name: "Archive" }));
      expect(onPress).toHaveBeenCalledWith("o2");

      open();
      const item = screen.getByRole("menuitem", { name: /^Archive/ });
      expect(item.getAttribute("aria-disabled")).toBe("true");
      expect(within(item).getByText("Working")).toBeTruthy();
      press(item);
      expect(onPress).toHaveBeenCalledTimes(1);

      await act(async () => {
        settle?.();
      });
      expect(
        screen.getByRole("menuitem", { name: "Archive" }).getAttribute("aria-disabled"),
      ).not.toBe("true");
    });
  });

  describe("selection and the bulk bar", () => {
    const bulkActions = [{ id: "archive", label: "Archive" }] as const;

    it("shows the bar only while several rows are selected, with their count", () => {
      draw(<DataTable {...baseProps} selectionMode="multiple" bulkActions={bulkActions} />);
      expect(screen.queryByRole("toolbar")).toBeNull();
      press(
        within(screen.getByRole("row", { name: /#1001/ })).getByRole("checkbox", { hidden: true }),
      );
      const toolbar = screen.getByRole("toolbar", { name: "Orders actions" });
      expect(within(toolbar).getByText("1 selected")).toBeTruthy();
      expect(within(toolbar).getByRole("button", { name: "Archive" })).toBeTruthy();
    });

    it("draws no bar for none or one", () => {
      const { rerender } = draw(
        <Engine selectionMode="single" options={{ initialState: { selection: ["o1"] } }} />,
      );
      expect(screen.queryByRole("toolbar")).toBeNull();
      rerender(
        <IconRegistryProvider registry={icons}>
          <Engine options={{ initialState: { selection: ["o1"] } }} />
        </IconRegistryProvider>,
      );
      expect(screen.queryByRole("toolbar")).toBeNull();
    });

    it("writes the selection to the engine as ids", () => {
      draw(<Engine selectionMode="multiple" options={{ initialState: { selection: ["o2"] } }} />);
      expect(screen.getByText("1 selected", { selector: "p" })).toBeTruthy();
      press(
        within(screen.getByRole("row", { name: /#1003/ })).getByRole("checkbox", { hidden: true }),
      );
      expect(seen.current?.state.selection).toEqual(["o2", "o3"]);
    });

    it("clears the selection from the bar and moves focus to the table's container", () => {
      const { container } = draw(
        <Engine selectionMode="multiple" options={{ initialState: { selection: ["o1", "o2"] } }} />,
      );
      press(screen.getByRole("button", { name: "Clear selection" }));
      expect(seen.current?.state.selection).toEqual([]);
      expect(screen.queryByRole("toolbar")).toBeNull();
      expect(document.activeElement).toBe(container.firstElementChild);
    });

    it("offers select all N for a fully selected page and keeps it, less the row, when a row is unticked", () => {
      draw(
        <Engine
          selectionMode="multiple"
          options={{
            mode: "server",
            totalCount: 245,
            initialState: { selection: ["o1", "o2", "o3"] },
          }}
        />,
      );
      press(screen.getByRole("button", { name: "Select all 245" }));
      expect(seen.current?.state.isAllMatchingSelected).toBe(true);
      expect(screen.getByText("245 selected", { selector: "p" })).toBeTruthy();
      press(
        within(screen.getByRole("row", { name: /#1001/ })).getByRole("checkbox", { hidden: true }),
      );
      // Every match but the unticked row stays chosen: the exception is remembered, the choice kept.
      expect(seen.current?.state.isAllMatchingSelected).toBe(true);
      expect(screen.getByText("244 selected", { selector: "p" })).toBeTruthy();
    });

    it("offers no select all N for a page that is only partly selected", () => {
      draw(
        <Engine
          selectionMode="multiple"
          options={{ mode: "server", totalCount: 245, initialState: { selection: ["o1"] } }}
        />,
      );
      expect(screen.queryByRole("button", { name: /^Select all/ })).toBeNull();
    });
  });

  describe("states", () => {
    it("shows the no-data state when nothing narrows the records and nothing is here", () => {
      draw(<DataTable {...baseProps} items={[]} />);
      const state = screen.getByRole("group", { name: "Orders" });
      expect(state.querySelector('[data-reason="no-data"]')).toBeTruthy();
      expect(
        within(state).getByRole("heading", { level: 3, name: "Nothing here yet" }),
      ).toBeTruthy();
    });

    it("shows the no-results state when the search narrows, and its button clears it but keeps the sort", () => {
      const sort = [{ column: "number", direction: "descending" }] as const;
      draw(<Engine options={{ initialState: { search: "zzz", sort } }} />);
      const state = screen.getByRole("group", { name: "Orders" });
      expect(state.querySelector('[data-reason="no-results"]')).toBeTruthy();
      press(within(state).getByRole("button", { name: "Clear filters" }));
      expect(seen.current?.state.search).toBe("");
      expect(seen.current?.state.filter.conditions).toEqual([]);
      expect(seen.current?.state.sort).toEqual(sort);
    });

    it("takes the app's own empty states and heading level", () => {
      const { rerender } = draw(
        <DataTable {...baseProps} items={[]} emptyState={<p>No orders yet</p>} />,
      );
      expect(screen.getByText("No orders yet")).toBeTruthy();
      rerender(
        <IconRegistryProvider registry={icons}>
          <Engine
            options={{ initialState: { search: "x" } }}
            filteredEmptyState={<p>Nothing like that</p>}
          />
        </IconRegistryProvider>,
      );
      expect(screen.getByText("Nothing like that")).toBeTruthy();
      rerender(
        <IconRegistryProvider registry={icons}>
          <DataTable {...baseProps} items={[]} headingLevel={2} />
        </IconRegistryProvider>,
      );
      expect(screen.getByRole("heading", { level: 2, name: "Nothing here yet" })).toBeTruthy();
    });

    it("shows a named skeleton for a first load and keeps the rows with a loading line for a reload", () => {
      const { rerender } = draw(
        <DataTable {...baseProps} items={[]} isLoading loadingLabel="Loading orders" />,
      );
      expect(screen.queryByRole("grid")).toBeNull();
      expect(screen.getByRole("status").textContent).toBe("Loading orders");

      rerender(
        <IconRegistryProvider registry={icons}>
          <DataTable {...baseProps} isLoading loadingLabel="Loading orders" />
        </IconRegistryProvider>,
      );
      expect(screen.getByRole("grid", { name: "Orders" })).toBeTruthy();
      expect(screen.getAllByText("Loading orders").length).toBeGreaterThan(0);
    });

    it("reads the loading state from a server engine", () => {
      draw(
        <Engine
          options={{ mode: "server", items: [], isLoading: true }}
          loadingLabel="Loading orders"
        />,
      );
      expect(screen.queryByRole("grid")).toBeNull();
    });

    it("shows an error state in place of the rows, with a retry only when the app can retry", () => {
      const onRetry = vi.fn();
      const { rerender } = draw(
        <DataTable
          {...baseProps}
          error={new Error("boom")}
          errorKind="unexpected"
          onRetry={onRetry}
          retryLabel="Retry"
        />,
      );
      expect(screen.queryByRole("grid")).toBeNull();
      expect(screen.getByRole("alert")).toBeTruthy();
      press(screen.getByRole("button", { name: "Retry" }));
      expect(onRetry).toHaveBeenCalledTimes(1);

      rerender(
        <IconRegistryProvider registry={icons}>
          <DataTable {...baseProps} error="failed" />
        </IconRegistryProvider>,
      );
      expect(screen.queryByRole("button", { name: /retry|try again/i })).toBeNull();
    });
  });

  describe("the engine's pager", () => {
    it("draws no pager when the engine does not page", () => {
      draw(<DataTable {...baseProps} />);
      expect(screen.queryByRole("navigation")).toBeNull();
    });

    it("names the pager after the table and walks the engine's pages", () => {
      draw(<Engine options={{ paging: "page", initialState: { pageSize: 1 } }} />);
      expect(within(pager("Orders pagination")).getByText("Page 1 of 3")).toBeTruthy();
      press(within(pager("Orders pagination")).getByRole("button", { name: "Next" }));
      expect(seen.current?.state.page).toBe(1);
      press(within(pager("Orders pagination")).getByRole("button", { name: "Previous" }));
      expect(seen.current?.state.page).toBe(0);
    });

    it("loads the next cursor page and goes back to the cursor it came from", () => {
      draw(
        <Engine
          paginationLabel="Order pages"
          options={{ mode: "server", paging: "cursor", nextCursor: "c2", totalCount: 9 }}
        />,
      );
      press(within(pager("Order pages")).getByRole("button", { name: "Next" }));
      expect(seen.current?.state).toMatchObject({ page: 1, cursor: "c2" });
      press(within(pager("Order pages")).getByRole("button", { name: "Previous" }));
      expect(seen.current?.state).toMatchObject({ page: 0, cursor: null });
    });

    it("draws none under a DataView, which owns the pager", () => {
      draw(
        <CollectionPagerContext.Provider value>
          <Engine options={{ paging: "page", initialState: { pageSize: 1 } }} />
        </CollectionPagerContext.Provider>,
      );
      expect(screen.queryByRole("navigation")).toBeNull();
    });
  });

  it("passes the root's other props through", () => {
    const { container } = draw(<DataTable {...baseProps} data-testid="orders" className="mine" />);
    const root = container.firstElementChild;
    expect(root?.getAttribute("data-testid")).toBe("orders");
    expect(root?.classList.contains("mine")).toBe(true);
  });

  it("extends the contract and refuses the names it dropped", () => {
    expectTypeOf<DataTableProps<Order>>().toExtend<DataTableContractProps<Order>>();
    // @ts-expect-error -- the sort is the engine's, not a separate prop
    const withSort: DataTableProps<Order> = { ...baseProps, sortDescriptor: undefined };
    // @ts-expect-error -- the resource query is gone: the engine holds the search, filter and sort
    const withQuery: DataTableProps<Order> = { ...baseProps, query: {} };
    // @ts-expect-error -- `commands` is a raw name; the contract's word is `rowActions`
    const raw: DataTableProps<Order> = { ...baseProps, commands: [] };
    expect([withSort, withQuery, raw]).toHaveLength(3);
  });
});
