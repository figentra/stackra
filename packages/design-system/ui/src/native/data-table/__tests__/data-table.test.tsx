/**
 * Stackra file contract:
 * Purpose: proves the native DataTable, the adapted form, hands the native Table its rows, columns and label with the
 *          sort read from `query.sort` and every sort the table asks for written back as the whole next query, adds an
 *          actions column only when `rowActions` is given and draws an `ActionMenu` named for the row in it (running an
 *          action once, with a pending action refused and marked), draws the `filterBar` slot above the list with a
 *          string wrapped in `Text`, hands the bottom bar the selection's count and "select all N" for a fully selected
 *          page, goes back to the rows shown when the selection changes while all matching is chosen, clears the
 *          selection from the bar, chooses the `no-results` empty state when the query narrows and the `no-data` one
 *          otherwise (its button clears filters but keeps the sort), shows a named skeleton for a first load, an error
 *          state with a retry in place of the list, cursor paging only when the app gave a handler, and passes the
 *          root's other props through.
 * Boundary: React Native does not render in vitest, so react-native and the sibling native components are replaced by
 *           recording stand-ins that render plain DOM; what reaches them is checked, not their rendering.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0313; ADR 0318 (decisions 2, 4 to 6 and 10); ADR
 *          0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-188 sta-350:FR-191 sta-350:FR-192
import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import type { ResourceQuery } from "#contracts/types/resource-query.type";
import type { TableColumn } from "#contracts/types/table-column.type";
import { DataTable, type DataTableProps } from "#native/data-table/data-table";

/** The props each stand-in was last handed, by name. */
const received = vi.hoisted(() => ({
  props: {} as Record<string, Record<string, unknown>>,
}));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: Record<string, unknown>) => {
      received.props["root"] = props;
      return createElement("div", { "data-testid": "root" }, props["children"] as ReactNode);
    },
  };
});

vi.mock("#native/text/text", async () => {
  const { createElement } = await import("react");
  return {
    Text: (props: Record<string, unknown>) =>
      createElement("span", { "data-text": "true" }, props["children"] as ReactNode),
  };
});

vi.mock("#native/button/button", async () => {
  const { createElement } = await import("react");
  return {
    Button: (props: Record<string, unknown>) =>
      createElement(
        "button",
        { onClick: props["onPress"] as () => void },
        props["children"] as ReactNode,
      ),
  };
});

vi.mock("#native/table/table", async () => {
  const { createElement } = await import("react");
  return {
    Table: (props: Record<string, unknown>) => {
      received.props["table"] = props;
      const items = props["items"] as readonly { readonly id: string }[];
      const columns = props["columns"] as readonly TableColumn[];
      const renderCell = props["renderCell"] as (item: unknown, column: TableColumn) => ReactNode;
      return createElement(
        "div",
        { "data-testid": "table" },
        items.length === 0
          ? (props["emptyState"] as ReactNode)
          : items.map((item) =>
              createElement(
                "div",
                { key: item.id, "data-row": item.id },
                columns.map((column) =>
                  createElement(
                    "div",
                    { key: column.id, "data-cell": column.id },
                    renderCell(item, column),
                  ),
                ),
              ),
            ),
      );
    },
  };
});

vi.mock("#native/action-menu/action-menu", async () => {
  const { createElement } = await import("react");
  return {
    ActionMenu: (props: Record<string, unknown>) => {
      const sections = props["sections"] as readonly {
        readonly items: readonly {
          readonly id: string;
          readonly label: string;
          readonly onPress?: () => void;
          readonly isDisabled?: boolean;
          readonly disabledReason?: string;
        }[];
      }[];
      return createElement(
        "div",
        { "aria-label": props["label"] as string, role: "group" },
        sections[0]?.items.map((item) =>
          createElement(
            "button",
            {
              key: item.id,
              "data-disabled": item.isDisabled ? "true" : undefined,
              "data-reason": item.disabledReason,
              onClick: item.onPress,
            },
            item.label,
          ),
        ),
      );
    },
  };
});

vi.mock("#native/bulk-action-bar/bulk-action-bar", async () => {
  const { createElement } = await import("react");
  return {
    BulkActionBar: (props: Record<string, unknown>) => {
      received.props["bar"] = props;
      return createElement(
        "button",
        { "data-testid": "bar", onClick: props["onClearSelection"] as () => void },
        String(props["selectedCount"]),
      );
    },
  };
});

vi.mock("#native/empty-state/empty-state", async () => {
  const { createElement } = await import("react");
  return {
    EmptyState: (props: Record<string, unknown>) => {
      received.props["empty"] = props;
      return createElement("div", { "data-testid": "empty" }, props["actions"] as ReactNode);
    },
  };
});

vi.mock("#native/error-state/error-state", async () => {
  const { createElement } = await import("react");
  return {
    ErrorState: (props: Record<string, unknown>) => {
      received.props["error"] = props;
      return createElement("div", { "data-testid": "error" });
    },
  };
});

vi.mock("#native/page-skeleton/page-skeleton", async () => {
  const { createElement } = await import("react");
  return {
    PageSkeleton: (props: Record<string, unknown>) => {
      received.props["skeleton"] = props;
      return createElement("div", { "data-testid": "skeleton" });
    },
  };
});

vi.mock("#native/cursor-pagination/cursor-pagination", async () => {
  const { createElement } = await import("react");
  return {
    CursorPagination: (props: Record<string, unknown>) => {
      received.props["pager"] = props;
      return createElement("div", { "data-testid": "pager" });
    },
  };
});

interface Order {
  readonly id: string;
  readonly number: string;
  readonly customer: string;
}

const ORDERS: readonly Order[] = [
  { id: "o1", number: "#1001", customer: "Ada" },
  { id: "o2", number: "#1002", customer: "Grace" },
];

const COLUMNS: readonly TableColumn[] = [
  { id: "number", label: "Order", isSortable: true },
  { id: "customer", label: "Customer" },
];

const QUERY: ResourceQuery = { search: "", filterValues: {}, sort: null };

const baseProps = {
  label: "Orders",
  items: ORDERS,
  columns: COLUMNS,
  query: QUERY,
  onQueryChange: () => undefined,
} satisfies DataTableProps<Order>;

const click = (element: HTMLElement) => act(() => void fireEvent.click(element));
const propsOf = (name: string) => received.props[name] ?? {};
const archiveOf = (name: string) =>
  screen.getByRole("group", { name }).querySelector("button") as HTMLElement;

describe("DataTable (native)", () => {
  beforeEach(() => {
    received.props = {};
  });

  it("hands the native Table its rows, columns and label, with the sort read from the query", () => {
    const sort = { column: "number", direction: "ascending" } as const;
    render(<DataTable {...baseProps} query={{ ...QUERY, sort }} />);
    expect(propsOf("table")["items"]).toBe(ORDERS);
    expect(propsOf("table")["columns"]).toBe(COLUMNS);
    expect(propsOf("table")["label"]).toBe("Orders");
    expect(propsOf("table")["sortDescriptor"]).toEqual(sort);
    render(<DataTable {...baseProps} />);
    expect(propsOf("table")["sortDescriptor"]).toBeUndefined();
  });

  // STA-486 item 8: inside a page's ScrollView the rows must not scroll, or React Native warns about nested lists.
  it("hands the Table scrollEnabled only when it is given", () => {
    render(<DataTable {...baseProps} scrollEnabled={false} />);
    expect(propsOf("table")["scrollEnabled"]).toBe(false);
    expect(propsOf("root")["scrollEnabled"]).toBeUndefined();
    render(<DataTable {...baseProps} />);
    expect(propsOf("table")).not.toHaveProperty("scrollEnabled");
  });

  it("writes the sort the table asks for into the whole next query", () => {
    const onQueryChange = vi.fn();
    render(
      <DataTable
        {...baseProps}
        query={{ search: "ada", filterValues: { status: "paid" }, sort: null }}
        onQueryChange={onQueryChange}
      />,
    );
    (propsOf("table")["onSortChange"] as (sort: unknown) => void)({
      column: "number",
      direction: "descending",
    });
    expect(onQueryChange).toHaveBeenCalledWith({
      search: "ada",
      filterValues: { status: "paid" },
      sort: { column: "number", direction: "descending" },
    });
  });

  describe("row actions", () => {
    it("adds an actions column and a menu named for the row only when rowActions is given", () => {
      const { rerender } = render(<DataTable {...baseProps} />);
      expect(propsOf("table")["columns"]).toBe(COLUMNS);
      rerender(<DataTable {...baseProps} rowActions={() => [{ id: "open", label: "Open" }]} />);
      const columns = propsOf("table")["columns"] as readonly TableColumn[];
      expect(columns.map((column) => column.label)).toEqual(["Order", "Customer", "Actions"]);
      expect(screen.getByRole("group", { name: "Actions for #1002" })).toBeTruthy();
    });

    it("draws no menu for a row with no actions", () => {
      render(
        <DataTable
          {...baseProps}
          rowActions={(order) => (order.id === "o1" ? [{ id: "open", label: "Open" }] : [])}
        />,
      );
      expect(screen.getAllByRole("group")).toHaveLength(1);
    });

    it("runs a row's action once and marks it pending until it settles", async () => {
      let settle: (() => void) | undefined;
      const onPress = vi.fn(
        (_id: string) =>
          new Promise<void>((resolve) => {
            settle = resolve;
          }),
      );
      render(
        <DataTable
          {...baseProps}
          rowActions={(order) => [
            { id: "archive", label: "Archive", onPress: () => onPress(order.id) },
          ]}
        />,
      );
      click(archiveOf("Actions for #1002"));
      expect(onPress).toHaveBeenCalledWith("o2");
      expect(archiveOf("Actions for #1002").getAttribute("data-disabled")).toBe("true");
      expect(archiveOf("Actions for #1002").getAttribute("data-reason")).toBe("Working");
      expect(archiveOf("Actions for #1001").getAttribute("data-disabled")).toBeNull();
      click(archiveOf("Actions for #1002"));
      expect(onPress).toHaveBeenCalledTimes(1);
      await act(async () => {
        settle?.();
      });
      expect(archiveOf("Actions for #1002").getAttribute("data-disabled")).toBeNull();
    });
  });

  it("draws the filterBar slot above the list, wrapping a string in Text", () => {
    const { rerender } = render(
      <DataTable {...baseProps} filterBar={<i data-testid="filters" />} />,
    );
    const root = screen.getByTestId("root");
    expect(root.firstElementChild?.getAttribute("data-testid")).toBe("filters");
    rerender(<DataTable {...baseProps} filterBar="Filters" />);
    expect(screen.getByText("Filters").getAttribute("data-text")).toBe("true");
  });

  describe("selection and the bottom bar", () => {
    it("draws the bar only for several selected, with the count the selection holds", () => {
      const { rerender } = render(<DataTable {...baseProps} selectionMode="single" />);
      expect(screen.queryByTestId("bar")).toBeNull();
      rerender(<DataTable {...baseProps} selectionMode="multiple" selectedKeys={["o1"]} />);
      expect(propsOf("bar")["selectedCount"]).toBe(1);
      expect(propsOf("bar")["label"]).toBe("Orders actions");
    });

    it("reports a change as ids and keeps its own copy only when the app does not control the selection", () => {
      const onSelectionChange = vi.fn();
      render(
        <DataTable
          {...baseProps}
          selectionMode="multiple"
          defaultSelectedKeys={["o1"]}
          onSelectionChange={onSelectionChange}
        />,
      );
      expect(propsOf("bar")["selectedCount"]).toBe(1);
      act(() =>
        (propsOf("table")["onSelectionChange"] as (keys: readonly string[]) => void)(["o1", "o2"]),
      );
      expect(onSelectionChange).toHaveBeenCalledWith(["o1", "o2"]);
      expect(propsOf("bar")["selectedCount"]).toBe(2);
      expect(propsOf("table")["selectedKeys"]).toEqual(["o1", "o2"]);
    });

    it("clears the selection from the bar", () => {
      const onSelectionChange = vi.fn();
      render(
        <DataTable
          {...baseProps}
          selectionMode="multiple"
          defaultSelectedKeys={["o1", "o2"]}
          onSelectionChange={onSelectionChange}
        />,
      );
      click(screen.getByTestId("bar"));
      expect(onSelectionChange).toHaveBeenCalledWith([]);
    });

    it("tells the bar a page is fully selected and passes select all N through", () => {
      const onAllMatchingSelectedChange = vi.fn();
      const { rerender } = render(
        <DataTable
          {...baseProps}
          selectionMode="multiple"
          selectedKeys={["o1"]}
          totalCount={245}
          onAllMatchingSelectedChange={onAllMatchingSelectedChange}
        />,
      );
      expect(propsOf("bar")["isPageSelected"]).toBe(false);
      rerender(
        <DataTable
          {...baseProps}
          selectionMode="multiple"
          selectedKeys={["o1", "o2"]}
          totalCount={245}
          onAllMatchingSelectedChange={onAllMatchingSelectedChange}
        />,
      );
      expect(propsOf("bar")["isPageSelected"]).toBe(true);
      expect(propsOf("bar")["totalCount"]).toBe(245);
      expect(propsOf("bar")["onAllMatchingSelectedChange"]).toBe(onAllMatchingSelectedChange);
    });

    it("goes back to the rows shown when the selection changes while all matching is chosen", () => {
      const onAllMatchingSelectedChange = vi.fn();
      render(
        <DataTable
          {...baseProps}
          selectionMode="multiple"
          selectedKeys={["o1", "o2"]}
          totalCount={245}
          isAllMatchingSelected
          onAllMatchingSelectedChange={onAllMatchingSelectedChange}
        />,
      );
      act(() =>
        (propsOf("table")["onSelectionChange"] as (keys: readonly string[]) => void)(["o1"]),
      );
      expect(onAllMatchingSelectedChange).toHaveBeenCalledWith(false);
    });
  });

  describe("states", () => {
    it("shows the no-data state when nothing narrows the records", () => {
      render(<DataTable {...baseProps} items={[]} />);
      expect(propsOf("empty")["reason"]).toBe("no-data");
      expect(propsOf("empty")["headingLevel"]).toBe(3);
    });

    it("shows the no-results state when the query narrows, and its button clears filters but keeps the sort", () => {
      const onQueryChange = vi.fn();
      render(
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
      expect(propsOf("empty")["reason"]).toBe("no-results");
      click(screen.getByRole("button", { name: "Clear filters" }));
      expect(onQueryChange).toHaveBeenCalledWith({
        search: "",
        filterValues: {},
        sort: { column: "number", direction: "descending" },
      });
    });

    it("takes the app's own empty states", () => {
      const { rerender } = render(
        <DataTable {...baseProps} items={[]} emptyState={<i data-testid="mine" />} />,
      );
      expect(screen.getByTestId("mine")).toBeTruthy();
      rerender(
        <DataTable
          {...baseProps}
          items={[]}
          query={{ ...QUERY, search: "x" }}
          filteredEmptyState={<i data-testid="theirs" />}
        />,
      );
      expect(screen.getByTestId("theirs")).toBeTruthy();
    });

    it("shows a named skeleton for a first load and the list for a reload", () => {
      const { rerender } = render(
        <DataTable {...baseProps} items={[]} isLoading loadingLabel="Loading orders" />,
      );
      expect(screen.queryByTestId("table")).toBeNull();
      expect(propsOf("skeleton")["loadingLabel"]).toBe("Loading orders");
      expect(propsOf("skeleton")["layout"]).toBe("table");
      rerender(<DataTable {...baseProps} isLoading loadingLabel="Loading orders" />);
      expect(screen.getByTestId("table")).toBeTruthy();
      expect(propsOf("table")["isLoading"]).toBe(true);
    });

    it("shows an error state in place of the list, with a retry only when the app can retry", () => {
      const onRetry = vi.fn();
      const error = new Error("boom");
      const { rerender } = render(
        <DataTable
          {...baseProps}
          error={error}
          errorKind="forbidden"
          onRetry={onRetry}
          retryLabel="Retry"
        />,
      );
      expect(screen.queryByTestId("table")).toBeNull();
      expect(propsOf("error")["error"]).toBe(error);
      expect(propsOf("error")["kind"]).toBe("forbidden");
      expect(propsOf("error")["retry"]).toEqual({ label: "Retry", onPress: onRetry });
      rerender(<DataTable {...baseProps} error="failed" />);
      expect(propsOf("error")["retry"]).toBeUndefined();
    });
  });

  describe("cursor paging", () => {
    it("draws no pager unless the app gave a handler", () => {
      render(<DataTable {...baseProps} hasMore />);
      expect(screen.queryByTestId("pager")).toBeNull();
    });

    it("names the pager after the table and hands it the page's own flags and handlers", () => {
      const onNext = vi.fn();
      render(<DataTable {...baseProps} hasMore hasPrevious onNext={onNext} />);
      expect(propsOf("pager")["label"]).toBe("Orders pagination");
      expect(propsOf("pager")["hasMore"]).toBe(true);
      expect(propsOf("pager")["hasPrevious"]).toBe(true);
      expect(propsOf("pager")["onNext"]).toBe(onNext);
      expect(propsOf("pager")["count"]).toBe(2);
    });
  });

  it("passes the root's other props through and keeps the caller's class", () => {
    render(<DataTable {...baseProps} testID="orders" className="mine" />);
    expect(propsOf("root")["testID"]).toBe("orders");
    expect(String(propsOf("root")["className"])).toContain("mine");
  });

  it("refuses the names the contract replaces", () => {
    // @ts-expect-error -- the sort is the query's, not a separate prop
    const withSort: DataTableProps<Order> = { ...baseProps, sortDescriptor: undefined };
    // @ts-expect-error -- `commands` is a raw name; the contract's word is `rowActions`
    const raw: DataTableProps<Order> = { ...baseProps, commands: [] };
    expect([withSort, raw]).toHaveLength(2);
  });
});
