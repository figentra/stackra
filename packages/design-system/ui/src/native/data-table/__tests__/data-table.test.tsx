/**
 * Stackra file contract:
 * Purpose: proves the native DataTable, the adapted form, draws from a `useCollection` engine: the shorthand `items` and
 *          `columns` run a client-mode engine of its own (its rows, visible columns and sort reach the native Table, and
 *          a sort the table asks for sorts the rows), an app's `collection` wins, hidden columns are left out, an
 *          actions column comes only with `rowActions` and draws an `ActionMenu` named for the row (running an action
 *          once, with a pending action refused and marked), the `filterBar` slot sits above the list with a string
 *          wrapped in `Text`, the bottom bar gets the engine's selection count, page-selected flag and "select all N",
 *          a selection change while all matching is chosen goes back to the rows shown, the bar clears the selection,
 *          the `no-results` empty state shows when the search or filter narrows (its button clears them but keeps the
 *          sort) and `no-data` otherwise, a named skeleton for a first load, an error state with a retry in place of
 *          the list, the engine's error and refresh by default, the pager only for `page` and `cursor` paging, `infinite`
 *          paging handed to the Table, and the root's other props passed through.
 * Boundary: React Native does not render in vitest, so react-native and the sibling native components are replaced by
 *           recording stand-ins that render plain DOM; the engine is the real `useCollection`.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0313; ADR 0505 (one data family); ADR 0022
 *          (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-188 sta-350:FR-191 sta-350:FR-192
import { act, fireEvent, render, screen } from "@testing-library/react";
import { useEffect, type ReactNode } from "react";

import type { CollectionColumn } from "#contracts/types/collection-column.type";
import type { CollectionController } from "#contracts/types/collection-controller.type";
import type { TableColumn } from "#contracts/types/table-column.type";
import { DataTable } from "#native/data-table/data-table";
import type { DataTableProps } from "#native/data-table/data-table.props";
import { useCollection } from "#react/hooks/use-collection";
import type { UseCollectionOptions } from "#react/hooks/use-collection-options.type";

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
        { type: "button", onClick: props["onPress"] as () => void },
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
              type: "button",
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
        { type: "button", "data-testid": "bar", onClick: props["onClearSelection"] as () => void },
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

vi.mock("#native/column-chooser/column-editor", async () => {
  const { createElement } = await import("react");
  return {
    ColumnEditor: (props: Record<string, unknown>) => {
      received.props["columnEditor"] = props;
      return createElement("div", { "data-testid": "column-editor" });
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

const COLUMNS: readonly CollectionColumn[] = [
  { id: "number", label: "Order", isSortable: true },
  { id: "customer", label: "Customer" },
];

const baseProps = {
  label: "Orders",
  items: ORDERS,
  columns: COLUMNS,
} satisfies DataTableProps<Order>;

/** The last engine the harness built. */
const seen: { engine?: CollectionController<Order> | undefined } = {};

/** A DataTable over an app's own seen.engine. */
function WithEngine({
  options,
  ...props
}: Omit<DataTableProps<Order>, "label"> & {
  readonly options?: Partial<UseCollectionOptions<Order>>;
}) {
  const collection = useCollection<Order>({ columns: COLUMNS, items: ORDERS, ...options });
  useEffect(() => {
    seen.engine = collection;
  });
  return <DataTable label="Orders" collection={collection} {...props} />;
}

const click = (element: HTMLElement) => act(() => void fireEvent.click(element));
const propsOf = (name: string) => received.props[name] ?? {};
const labelsOf = (name: string) =>
  (propsOf(name)["columns"] as readonly TableColumn[]).map((column) => column.label);
const idsOf = (name: string) =>
  (propsOf(name)["items"] as readonly { readonly id: string }[]).map((item) => item.id);
const archiveOf = (name: string) =>
  screen.getByRole("group", { name }).querySelector("button") as HTMLElement;

describe("DataTable (native)", () => {
  beforeEach(() => {
    received.props = {};
    seen.engine = undefined;
  });

  it("runs its own engine over the shorthand and sorts the rows the table asks for", () => {
    render(<DataTable {...baseProps} />);
    expect(idsOf("table")).toEqual(["o1", "o2"]);
    expect(labelsOf("table")).toEqual(["Order", "Customer"]);
    expect(propsOf("table")["label"]).toBe("Orders");
    expect(propsOf("table")["sort"]).toEqual([]);
    act(() =>
      (propsOf("table")["onSortChange"] as (sort: unknown) => void)({
        column: "number",
        direction: "descending",
      }),
    );
    expect(propsOf("table")["sort"]).toEqual([{ column: "number", direction: "descending" }]);
    expect(idsOf("table")).toEqual(["o2", "o1"]);
  });

  it("draws the app's engine, leaving out its hidden columns", () => {
    render(
      <WithEngine
        options={{
          initialState: { columns: [{ id: "number" }, { id: "customer", isHidden: true }] },
        }}
      />,
    );
    expect(labelsOf("table")).toEqual(["Order"]);
    act(() => seen.engine?.setSort([{ column: "number", direction: "descending" }]));
    expect(idsOf("table")).toEqual(["o2", "o1"]);
  });

  // STA-486 item 8: inside a page's ScrollView the rows must not scroll, or React Native warns about nested lists.
  it("hands the Table scrollEnabled only when it is given", () => {
    render(<DataTable {...baseProps} scrollEnabled={false} />);
    expect(propsOf("table")["scrollEnabled"]).toBe(false);
    expect(propsOf("root")["scrollEnabled"]).toBeUndefined();
    render(<DataTable {...baseProps} />);
    expect(propsOf("table")).not.toHaveProperty("scrollEnabled");
  });

  describe("row actions", () => {
    it("adds an actions column and a menu named for the row only when rowActions is given", () => {
      const { rerender } = render(<DataTable {...baseProps} />);
      expect(labelsOf("table")).toEqual(["Order", "Customer"]);
      rerender(<DataTable {...baseProps} rowActions={() => [{ id: "open", label: "Open" }]} />);
      expect(labelsOf("table")).toEqual(["Order", "Customer", "Actions"]);
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

  it("gives the phone's column tools, a ColumnEditor on the table's engine, only with hasColumnTools", () => {
    const { rerender } = render(<DataTable {...baseProps} />);
    expect(screen.queryByTestId("column-editor")).toBeNull();
    rerender(<DataTable {...baseProps} hasColumnTools />);
    expect(screen.getByTestId("column-editor")).toBeTruthy();
    expect(propsOf("columnEditor")["isIconOnly"]).toBe(true);
    expect(propsOf("columnEditor")["collection"]).toMatchObject({
      visibleColumns: expect.any(Array),
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
    it("draws the bar only for several selected, with the engine's count", () => {
      const { unmount } = render(<DataTable {...baseProps} selectionMode="single" />);
      expect(screen.queryByTestId("bar")).toBeNull();
      unmount();
      render(
        <WithEngine selectionMode="multiple" options={{ initialState: { selection: ["o1"] } }} />,
      );
      expect(propsOf("bar")["selectedCount"]).toBe(1);
      expect(propsOf("bar")["label"]).toBe("Orders actions");
      expect(propsOf("bar")["isPageSelected"]).toBe(false);
    });

    it("writes a change to the engine and clears it from the bar", () => {
      render(<WithEngine selectionMode="multiple" />);
      act(() =>
        (propsOf("table")["onSelectionChange"] as (keys: readonly string[]) => void)(["o1", "o2"]),
      );
      expect(seen.engine?.state.selection).toEqual(["o1", "o2"]);
      expect(propsOf("bar")["selectedCount"]).toBe(2);
      expect(propsOf("bar")["isPageSelected"]).toBe(true);
      expect(propsOf("table")["selectedKeys"]).toEqual(["o1", "o2"]);
      click(screen.getByTestId("bar"));
      expect(seen.engine?.state.selection).toEqual([]);
    });

    it("offers select all N from the engine and goes back to the rows shown on a change", () => {
      render(
        <WithEngine
          selectionMode="multiple"
          options={{ mode: "server", totalCount: 245, initialState: { selection: ["o1", "o2"] } }}
        />,
      );
      expect(propsOf("bar")["totalCount"]).toBe(245);
      act(() => (propsOf("bar")["onAllMatchingSelectedChange"] as (is: boolean) => void)(true));
      expect(seen.engine?.state.isAllMatchingSelected).toBe(true);
      expect(propsOf("bar")["isAllMatchingSelected"]).toBe(true);
      act(() =>
        (propsOf("table")["onSelectionChange"] as (keys: readonly string[]) => void)(["o1"]),
      );
      expect(seen.engine?.state.isAllMatchingSelected).toBe(false);
    });
  });

  describe("states", () => {
    it("shows the no-data state when nothing narrows the records", () => {
      render(<DataTable {...baseProps} items={[]} />);
      expect(propsOf("empty")["reason"]).toBe("no-data");
      expect(propsOf("empty")["headingLevel"]).toBe(3);
    });

    it("shows the no-results state when the search narrows, and its button clears it but keeps the sort", () => {
      const sort = [{ column: "number", direction: "descending" }] as const;
      render(<WithEngine options={{ initialState: { search: "zzz", sort } }} />);
      expect(propsOf("empty")["reason"]).toBe("no-results");
      click(screen.getByRole("button", { name: "Clear filters" }));
      expect(seen.engine?.state.search).toBe("");
      expect(seen.engine?.state.filter.conditions).toEqual([]);
      expect(seen.engine?.state.sort).toEqual(sort);
    });

    it("takes the app's own empty states", () => {
      const { unmount } = render(
        <DataTable {...baseProps} items={[]} emptyState={<i data-testid="mine" />} />,
      );
      expect(screen.getByTestId("mine")).toBeTruthy();
      unmount();
      render(
        <WithEngine
          options={{ initialState: { search: "x" } }}
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

    it("shows an error state in place of the list, with a retry only when one is known", () => {
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

    it("retries a server engine with its own refresh", () => {
      render(<WithEngine options={{ mode: "server" }} error="failed" />);
      expect(propsOf("error")["retry"]).toEqual({
        label: "Try again",
        onPress: seen.engine?.refresh,
      });
    });
  });

  describe("paging", () => {
    it("draws no pager without engine pages", () => {
      render(<DataTable {...baseProps} />);
      expect(screen.queryByTestId("pager")).toBeNull();
    });

    it("pages the engine: next and previous move its page", () => {
      render(<WithEngine options={{ paging: "page", initialState: { pageSize: 1 } }} />);
      expect(propsOf("pager")["label"]).toBe("Orders pagination");
      expect(propsOf("pager")["hasMore"]).toBe(true);
      expect(propsOf("pager")["hasPrevious"]).toBe(false);
      expect(propsOf("pager")["count"]).toBe(1);
      act(() => (propsOf("pager")["onNext"] as () => void)());
      expect(seen.engine?.state.page).toBe(1);
      expect(idsOf("table")).toEqual(["o2"]);
      expect(propsOf("pager")["hasPrevious"]).toBe(true);
      act(() => (propsOf("pager")["onPrevious"] as () => void)());
      expect(seen.engine?.state.page).toBe(0);
    });

    it("loads the next cursor page with the engine", () => {
      render(<WithEngine options={{ mode: "server", paging: "cursor", nextCursor: "c2" }} />);
      act(() => (propsOf("pager")["onNext"] as () => void)());
      expect(seen.engine?.state.cursor).toBe("c2");
    });

    it("hands an infinite engine's end to the Table", () => {
      render(<WithEngine options={{ mode: "server", paging: "infinite", totalCount: 10 }} />);
      expect(screen.queryByTestId("pager")).toBeNull();
      expect(propsOf("table")["hasMore"]).toBe(true);
      expect(propsOf("table")["onLoadMore"]).toBe(seen.engine?.loadMore);
    });
  });

  it("passes the root's other props through and keeps the caller's class", () => {
    render(<DataTable {...baseProps} testID="orders" className="mine" />);
    expect(propsOf("root")["testID"]).toBe("orders");
    expect(String(propsOf("root")["className"])).toContain("mine");
  });

  it("refuses the names the contract replaces", () => {
    // @ts-expect-error -- the sort is the engine's, not a prop
    const withSort: DataTableProps<Order> = { ...baseProps, sortDescriptor: undefined };
    // @ts-expect-error -- the resource query was replaced by the engine (ADR 0505)
    const withQuery: DataTableProps<Order> = { ...baseProps, query: {} };
    // @ts-expect-error -- `commands` is a raw name; the contract's word is `rowActions`
    const raw: DataTableProps<Order> = { ...baseProps, commands: [] };
    expect([withSort, withQuery, raw]).toHaveLength(3);
  });
});
