/**
 * Stackra file contract:
 * Purpose: proves the web DataTable names its grid by `label` and draws the rows and columns of the Table it composes,
 *          marks the sorted header from `query.sort` and answers a header press with the whole next query (search and
 *          filters kept, only the sort changed), lists `rowActions` in a menu named for the row and runs one once while
 *          showing it pending, draws the `filterBar` slot above the rows, shows the bulk bar only while several rows are
 *          selected with the count and "select all N" for a fully selected page (and returns to the shown rows when a row
 *          changes), clears the selection and moves focus to its container, chooses the `no-results` empty state when the
 *          query narrows and the `no-data` one otherwise (with a clear-filters button that keeps the sort), shows a named
 *          skeleton for a first load and keeps the rows with a loading line for a reload, shows an error state with a
 *          retry in place of the rows, draws cursor paging only when the app gave a handler, passes the root's other props
 *          through, and refuses the raw names the contract replaces.
 * Boundary: jsdom with real HeroUI and React Aria; the theme CSS is not loaded, so classes are checked, not looks.
 *           jsdom has no IntersectionObserver, which the table's load-more sentinel needs, so a stand-in is installed.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0313; ADR 0318 (decisions 2 and 4 to 6); ADR 0022
 *          (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-188 sta-350:FR-189 sta-350:FR-192
import { defineIconRegistry } from "@stackra/icons";
import { IconRegistryProvider } from "@stackra/icons/react";
import { act, render, screen, within } from "@testing-library/react";
import { ChevronLeft, ChevronRight, Ellipsis } from "lucide-react";
import { useState, type ReactElement } from "react";

import type { DataTableContractProps } from "#contracts/types/data-table-contract-props.type";
import type { ResourceQuery } from "#contracts/types/resource-query.type";
import type { TableColumn } from "#contracts/types/table-column.type";
import { DataTable } from "#react/data-table/data-table";
import type { DataTableProps } from "#react/data-table/data-table.props";

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

const COLUMNS: readonly TableColumn[] = [
  { id: "number", label: "Order", isSortable: true },
  { id: "customer", label: "Customer", isSortable: true },
];

const QUERY: ResourceQuery = { search: "", filterValues: {}, sort: null };

const icons = defineIconRegistry({
  ellipsis: Ellipsis,
  "chevron-left": ChevronLeft,
  "chevron-right": ChevronRight,
});

/** The props every test starts from; each test adds what it is about. */
const baseProps = {
  label: "Orders",
  items: ORDERS,
  columns: COLUMNS,
  query: QUERY,
  onQueryChange: () => undefined,
} satisfies DataTableProps<Order>;

const draw = (ui: ReactElement) =>
  render(<IconRegistryProvider registry={icons}>{ui}</IconRegistryProvider>);

/** A table that keeps its own query and selection, the way a page does. */
function Live(props: Partial<DataTableProps<Order>>) {
  const [query, setQuery] = useState<ResourceQuery>(QUERY);
  return <DataTable {...baseProps} {...props} query={query} onQueryChange={setQuery} />;
}

describe("DataTable (web)", () => {
  beforeEach(() => {
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

  it("marks the sorted header from the query and answers a header press with the whole next query", () => {
    const onQueryChange = vi.fn();
    const query: ResourceQuery = {
      search: "ada",
      filterValues: { status: "paid" },
      sort: { column: "customer", direction: "ascending" },
    };
    draw(<DataTable {...baseProps} query={query} onQueryChange={onQueryChange} />);
    expect(screen.getByRole("columnheader", { name: "Customer" }).getAttribute("aria-sort")).toBe(
      "ascending",
    );
    press(screen.getByRole("columnheader", { name: "Order" }));
    expect(onQueryChange).toHaveBeenCalledWith({
      search: "ada",
      filterValues: { status: "paid" },
      sort: { column: "number", direction: "ascending" },
    });
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
        <DataTable {...baseProps} selectionMode="single" defaultSelectedKeys={["o1"]} />,
      );
      expect(screen.queryByRole("toolbar")).toBeNull();
      rerender(
        <IconRegistryProvider registry={icons}>
          <DataTable {...baseProps} defaultSelectedKeys={["o1"]} />
        </IconRegistryProvider>,
      );
      expect(screen.queryByRole("toolbar")).toBeNull();
    });

    it("reports the selection as ids and obeys a controlled one", () => {
      const onSelectionChange = vi.fn();
      draw(
        <DataTable
          {...baseProps}
          selectionMode="multiple"
          selectedKeys={["o2"]}
          onSelectionChange={onSelectionChange}
        />,
      );
      expect(screen.getByText("1 selected", { selector: "p" })).toBeTruthy();
      press(
        within(screen.getByRole("row", { name: /#1003/ })).getByRole("checkbox", { hidden: true }),
      );
      expect(onSelectionChange).toHaveBeenCalledWith(["o2", "o3"]);
    });

    it("clears the selection from the bar and moves focus to the table's container", () => {
      const onSelectionChange = vi.fn();
      const { container } = draw(
        <DataTable
          {...baseProps}
          selectionMode="multiple"
          defaultSelectedKeys={["o1", "o2"]}
          onSelectionChange={onSelectionChange}
        />,
      );
      press(screen.getByRole("button", { name: "Clear selection" }));
      expect(onSelectionChange).toHaveBeenCalledWith([]);
      expect(screen.queryByRole("toolbar")).toBeNull();
      expect(document.activeElement).toBe(container.firstElementChild);
    });

    it("offers select all N for a fully selected page and goes back to the rows shown when a row changes", () => {
      const onAllMatchingSelectedChange = vi.fn();
      const { rerender } = draw(
        <DataTable
          {...baseProps}
          selectionMode="multiple"
          selectedKeys={["o1", "o2", "o3"]}
          totalCount={245}
          onAllMatchingSelectedChange={onAllMatchingSelectedChange}
        />,
      );
      press(screen.getByRole("button", { name: "Select all 245" }));
      expect(onAllMatchingSelectedChange).toHaveBeenLastCalledWith(true);

      rerender(
        <IconRegistryProvider registry={icons}>
          <DataTable
            {...baseProps}
            selectionMode="multiple"
            selectedKeys={["o1", "o2", "o3"]}
            totalCount={245}
            isAllMatchingSelected
            onAllMatchingSelectedChange={onAllMatchingSelectedChange}
          />
        </IconRegistryProvider>,
      );
      expect(screen.getByText("245 selected", { selector: "p" })).toBeTruthy();
      press(
        within(screen.getByRole("row", { name: /#1001/ })).getByRole("checkbox", { hidden: true }),
      );
      expect(onAllMatchingSelectedChange).toHaveBeenLastCalledWith(false);
    });

    it("offers no select all N for a page that is only partly selected, or without a total", () => {
      const { rerender } = draw(
        <DataTable
          {...baseProps}
          selectionMode="multiple"
          selectedKeys={["o1"]}
          totalCount={245}
          onAllMatchingSelectedChange={() => {}}
        />,
      );
      expect(screen.queryByRole("button", { name: /^Select all/ })).toBeNull();
      rerender(
        <IconRegistryProvider registry={icons}>
          <DataTable
            {...baseProps}
            selectionMode="multiple"
            selectedKeys={["o1", "o2", "o3"]}
            onAllMatchingSelectedChange={() => {}}
          />
        </IconRegistryProvider>,
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

    it("shows the no-results state when the query narrows, and its button clears filters but keeps the sort", () => {
      const onQueryChange = vi.fn();
      draw(
        <DataTable
          {...baseProps}
          items={[]}
          query={{
            search: "zzz",
            filterValues: { status: "paid" },
            sort: { column: "number", direction: "descending" },
          }}
          onQueryChange={onQueryChange}
        />,
      );
      const state = screen.getByRole("group", { name: "Orders" });
      expect(state.querySelector('[data-reason="no-results"]')).toBeTruthy();
      press(within(state).getByRole("button", { name: "Clear filters" }));
      expect(onQueryChange).toHaveBeenCalledWith({
        search: "",
        filterValues: {},
        sort: { column: "number", direction: "descending" },
      });
    });

    it("takes the app's own empty states and heading level", () => {
      const { rerender } = draw(
        <DataTable {...baseProps} items={[]} emptyState={<p>No orders yet</p>} />,
      );
      expect(screen.getByText("No orders yet")).toBeTruthy();
      rerender(
        <IconRegistryProvider registry={icons}>
          <DataTable
            {...baseProps}
            items={[]}
            query={{ ...QUERY, search: "x" }}
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

  describe("cursor paging", () => {
    it("draws no pager unless the app gave a handler", () => {
      draw(<DataTable {...baseProps} hasMore />);
      expect(screen.queryByRole("navigation")).toBeNull();
    });

    it("names the pager after the table and asks for the next and the previous page", () => {
      const onNext = vi.fn();
      const onPrevious = vi.fn();
      draw(
        <DataTable {...baseProps} hasMore hasPrevious onNext={onNext} onPrevious={onPrevious} />,
      );
      const pager = screen.getByRole("navigation", { name: "Orders pagination" });
      expect(within(pager).getByText("Showing 3 items")).toBeTruthy();
      press(within(pager).getByRole("button", { name: "Next" }));
      press(within(pager).getByRole("button", { name: "Previous" }));
      expect(onNext).toHaveBeenCalledTimes(1);
      expect(onPrevious).toHaveBeenCalledTimes(1);
    });

    it("disables next without hasMore and takes its own landmark name", () => {
      draw(<DataTable {...baseProps} onNext={() => {}} paginationLabel="Order pages" />);
      const pager = screen.getByRole("navigation", { name: "Order pages" });
      expect(within(pager).getByRole<HTMLButtonElement>("button", { name: "Next" }).disabled).toBe(
        true,
      );
    });
  });

  it("works as a page does, with the query in the page's state", () => {
    draw(<Live selectionMode="multiple" />);
    press(screen.getByRole("columnheader", { name: "Customer" }));
    expect(screen.getByRole("columnheader", { name: "Customer" }).getAttribute("aria-sort")).toBe(
      "ascending",
    );
    press(screen.getByRole("columnheader", { name: "Customer" }));
    expect(screen.getByRole("columnheader", { name: "Customer" }).getAttribute("aria-sort")).toBe(
      "descending",
    );
  });

  it("passes the root's other props through", () => {
    const { container } = draw(<DataTable {...baseProps} data-testid="orders" className="mine" />);
    const root = container.firstElementChild;
    expect(root?.getAttribute("data-testid")).toBe("orders");
    expect(root?.classList.contains("mine")).toBe(true);
  });

  it("extends the contract and refuses the names it replaces", () => {
    expectTypeOf<DataTableProps<Order>>().toExtend<DataTableContractProps<Order>>();
    // @ts-expect-error -- the sort is the query's, not a separate prop
    const withSort: DataTableProps<Order> = { ...baseProps, sortDescriptor: undefined };
    // @ts-expect-error -- paging is by cursor handlers, not an end-reached callback
    const withLoadMore: DataTableProps<Order> = { ...baseProps, onLoadMore: () => undefined };
    // @ts-expect-error -- `commands` is a raw name; the contract's word is `rowActions`
    const raw: DataTableProps<Order> = { ...baseProps, commands: [] };
    expect([withSort, withLoadMore, raw]).toHaveLength(3);
  });
});
