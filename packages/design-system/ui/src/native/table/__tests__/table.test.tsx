/**
 * Stackra file contract:
 * Purpose: proves the native Table, the adapted form, hands the FlatList the items, a key per id, its label and busy
 *          state, draws a card per row with the row-header cell as a title and the other cells as labelled lines (text
 *          wrapped in `Text`, nodes as given), turns a selectable row into one pressable `checkbox` or `radio` that
 *          reports a list of ids in the items' order (controlled or not), draws a sort chooser of one button per sortable
 *          column that asks `nextSortDescriptor` for the sort and names its direction, shows a spinner with the loading
 *          text instead of the empty state while loading and the empty state otherwise, asks for more only while more
 *          pages exist and nothing loads, accepts the web-only props and reads them as nothing, passes the rest through,
 *          and refuses the list's own data, row renderer and children.
 * Boundary: React Native does not render in vitest, so react-native, heroui-native and the sibling native components are
 *           replaced by recording stand-ins that render plain DOM; what reaches them is checked, not their rendering.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0313; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-124
import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import type { SortDescriptor } from "#contracts/types/sort-descriptor.type";
import type { TableColumn } from "#contracts/types/table-column.type";
import type { TableContractProps } from "#contracts/types/table-contract-props.type";
import { Table } from "#native/table/table";
import type { TableProps } from "#native/table/table.props";

/** The props the list, each pressable and each sort button were last handed. */
const received = vi.hoisted(() => ({
  list: {} as Record<string, unknown>,
  pressables: [] as Record<string, unknown>[],
  buttons: [] as Record<string, unknown>[],
  texts: [] as Record<string, unknown>[],
  boxes: [] as Record<string, unknown>[],
}));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: Record<string, unknown>) =>
      createElement("div", { "data-role": props["role"] }, props["children"] as ReactNode),
    Pressable: (props: Record<string, unknown>) => {
      received.pressables.push(props);
      return createElement(
        "div",
        { "data-testid": "pressable", onClick: props["onPress"] as () => void },
        props["children"] as ReactNode,
      );
    },
    FlatList: (props: Record<string, unknown>) => {
      received.list = props;
      const data = props["data"] as readonly Record<string, unknown>[];
      const renderItem = props["renderItem"] as (info: { item: unknown }) => ReactNode;
      const keyOf = props["keyExtractor"] as (item: unknown) => string;
      return createElement(
        "div",
        { "data-testid": "list" },
        props["ListHeaderComponent"] as ReactNode,
        data.length === 0
          ? (props["ListEmptyComponent"] as ReactNode)
          : data.map((item) => createElement("div", { key: keyOf(item) }, renderItem({ item }))),
        props["ListFooterComponent"] as ReactNode,
      );
    },
  };
});

vi.mock("heroui-native", async () => {
  const { createElement } = await import("react");
  return {
    Checkbox: (props: Record<string, unknown>) => {
      received.boxes.push(props);
      return createElement("i", { "data-testid": "box" });
    },
  };
});

vi.mock("#native/text/text", async () => {
  const { createElement } = await import("react");
  return {
    Text: (props: Record<string, unknown>) => {
      received.texts.push(props);
      return createElement("span", {}, props["children"] as ReactNode);
    },
  };
});

vi.mock("#native/spinner/spinner", async () => {
  const { createElement } = await import("react");
  return { Spinner: () => createElement("i", { "data-testid": "spinner" }) };
});

vi.mock("#native/button/button", async () => {
  const { createElement } = await import("react");
  return {
    Button: (props: Record<string, unknown>) => {
      received.buttons.push(props);
      return createElement(
        "button",
        { "aria-label": props["label"] as string, onClick: props["onPress"] as () => void },
        props["children"] as ReactNode,
      );
    },
  };
});

interface Order {
  readonly id: string;
  readonly customer: string;
  readonly total: number;
}

const ORDERS: readonly Order[] = [
  { id: "o1", customer: "Ada", total: 12 },
  { id: "o2", customer: "Grace", total: 30 },
  { id: "o3", customer: "Linus", total: 7 },
];

const COLUMNS: readonly TableColumn[] = [
  { id: "customer", label: "Customer", isSortable: true },
  { id: "total", label: "Total", isSortable: true },
];

const baseProps = { label: "Orders", items: ORDERS, columns: COLUMNS } as const;

const pressables = () => screen.getAllByTestId("pressable");
const click = (element: HTMLElement) => act(() => void fireEvent.click(element));

describe("Table (native)", () => {
  beforeEach(() => {
    received.list = {};
    received.pressables = [];
    received.buttons = [];
    received.texts = [];
    received.boxes = [];
  });

  it("hands the list the items, a key per id, its label and its busy state", () => {
    const { rerender } = render(<Table {...baseProps} />);
    expect(received.list["data"]).toBe(ORDERS);
    expect((received.list["keyExtractor"] as (item: Order) => string)(ORDERS[1] as Order)).toBe(
      "o2",
    );
    expect(received.list).toMatchObject({
      accessibilityLabel: "Orders",
      role: "list",
      accessibilityState: { busy: false },
    });
    rerender(<Table {...baseProps} isLoading />);
    expect(received.list["accessibilityState"]).toMatchObject({ busy: true });
  });

  it("draws the row header as a title and every other cell under its column's name", () => {
    render(<Table {...baseProps} />);
    const titles = received.texts.filter((text) => text["className"] === "font-semibold");
    expect(titles.map((text) => text["children"])).toEqual(["Ada", "Grace", "Linus"]);
    const captions = received.texts.filter((text) => text["type"] === "caption");
    expect(captions.map((text) => text["children"])).toEqual(["Total", "Total", "Total"]);
    // A default cell is text, wrapped in Text because React Native refuses a bare string.
    expect(screen.getByText("30")).toBeTruthy();
  });

  it("makes the chosen column the title", () => {
    render(
      <Table
        {...baseProps}
        columns={[
          { id: "customer", label: "Customer" },
          { id: "total", label: "Total", isRowHeader: true },
        ]}
      />,
    );
    const titles = received.texts.filter((text) => text["className"] === "font-semibold");
    expect(titles.map((text) => text["children"])).toEqual(["12", "30", "7"]);
  });

  it("draws what renderCell returns, wrapping text and leaving a node as given", () => {
    render(
      <Table
        {...baseProps}
        renderCell={(item, column) =>
          column.id === "total" ? <b data-testid="custom">{item.total}</b> : item.customer
        }
      />,
    );
    expect(screen.getAllByTestId("custom")).toHaveLength(3);
    expect(screen.getByText("Grace")).toBeTruthy();
  });

  it("draws plain cards with no pressables when nothing is selectable", () => {
    render(<Table {...baseProps} />);
    expect(screen.queryAllByTestId("pressable")).toHaveLength(0);
  });

  it("makes a row for several one pressable checkbox with a hidden box, reporting ids in order", () => {
    const onSelectionChange = vi.fn<(keys: readonly string[]) => void>();
    render(<Table {...baseProps} selectionMode="multiple" onSelectionChange={onSelectionChange} />);
    expect(received.pressables[0]).toMatchObject({
      role: "checkbox",
      accessibilityState: { checked: false, selected: false },
    });
    click(pressables()[2] as HTMLElement);
    expect(onSelectionChange).toHaveBeenLastCalledWith(["o3"]);
    click(pressables()[0] as HTMLElement);
    expect(onSelectionChange).toHaveBeenLastCalledWith(["o1", "o3"]);
    click(pressables()[2] as HTMLElement);
    expect(onSelectionChange).toHaveBeenLastCalledWith(["o1"]);
    expect(received.boxes.at(-3)).toMatchObject({ isSelected: true });
  });

  it("makes a row for one a radio that replaces the selection and draws no box", () => {
    const onSelectionChange = vi.fn<(keys: readonly string[]) => void>();
    render(<Table {...baseProps} selectionMode="single" onSelectionChange={onSelectionChange} />);
    expect(received.pressables[0]).toMatchObject({ role: "radio" });
    expect(screen.queryAllByTestId("box")).toHaveLength(0);
    click(pressables()[1] as HTMLElement);
    click(pressables()[2] as HTMLElement);
    expect(onSelectionChange.mock.calls.map(([keys]) => keys)).toEqual([["o2"], ["o3"]]);
  });

  it("starts from defaultSelectedKeys and follows selectedKeys when controlled", () => {
    const { rerender } = render(
      <Table {...baseProps} selectionMode="multiple" defaultSelectedKeys={["o2"]} />,
    );
    expect(received.pressables[1]).toMatchObject({ accessibilityState: { checked: true } });
    received.pressables = [];
    rerender(<Table {...baseProps} selectionMode="multiple" selectedKeys={["o3"]} />);
    expect(received.pressables[2]).toMatchObject({ accessibilityState: { checked: true } });
    expect(received.pressables[1]).toMatchObject({ accessibilityState: { checked: false } });
  });

  it("draws a sort button per sortable column and asks for the next sort on a press", () => {
    const onSortChange = vi.fn<(sort: SortDescriptor) => void>();
    const { rerender } = render(<Table {...baseProps} onSortChange={onSortChange} />);
    expect(received.buttons.map((button) => button["label"])).toEqual([
      "Sort by Customer",
      "Sort by Total",
    ]);
    click(screen.getByRole("button", { name: "Sort by Total" }));
    expect(onSortChange).toHaveBeenLastCalledWith({ column: "total", direction: "ascending" });

    rerender(
      <Table
        {...baseProps}
        sortDescriptor={{ column: "total", direction: "ascending" }}
        onSortChange={onSortChange}
      />,
    );
    click(screen.getByRole("button", { name: "Sort by Total, ascending" }));
    expect(onSortChange).toHaveBeenLastCalledWith({ column: "total", direction: "descending" });
  });

  it("marks the sorted column's button and shows its direction", () => {
    render(
      <Table {...baseProps} sortDescriptor={{ column: "customer", direction: "descending" }} />,
    );
    const sorted = received.buttons.find(
      (button) => button["label"] === "Sort by Customer, descending",
    );
    expect(sorted).toMatchObject({
      variant: "secondary",
      endIcon: "arrow-down",
      accessibilityState: { selected: true },
    });
    const other = received.buttons.find((button) => button["label"] === "Sort by Total");
    expect(other).toMatchObject({ variant: "tertiary", accessibilityState: { selected: false } });
    expect(other).not.toHaveProperty("endIcon");
  });

  it("draws no sort chooser when no column is sortable", () => {
    render(<Table {...baseProps} columns={[{ id: "customer", label: "Customer" }]} />);
    expect(received.list["ListHeaderComponent"]).toBeNull();
  });

  it("shows the empty state only when there are no rows and nothing loads", () => {
    const { rerender } = render(
      <Table {...baseProps} items={[]} emptyState={<p data-testid="empty">No orders</p>} />,
    );
    expect(screen.getByTestId("empty")).toBeTruthy();
    rerender(
      <Table
        {...baseProps}
        items={[]}
        emptyState={<p data-testid="empty">No orders</p>}
        isLoading
      />,
    );
    expect(screen.queryByTestId("empty")).toBeNull();
    expect(screen.getByTestId("spinner")).toBeTruthy();
  });

  it("wraps a string empty state in Text and drops a node that is not an element", () => {
    const { rerender } = render(<Table {...baseProps} items={[]} emptyState="No orders" />);
    expect(screen.getByText("No orders")).toBeTruthy();
    rerender(<Table {...baseProps} items={[]} emptyState={false} />);
    expect(received.list["ListEmptyComponent"]).toBeNull();
  });

  it("says what loads once, as text beside a decorative spinner", () => {
    render(<Table {...baseProps} items={[]} isLoading loadingLabel="Loading orders" />);
    expect(screen.getAllByText("Loading orders")).toHaveLength(1);
  });

  it("keeps the rows and adds the loading row after them while a reload runs", () => {
    render(<Table {...baseProps} isLoading />);
    expect(screen.getByText("Grace")).toBeTruthy();
    expect(screen.getByText("Loading")).toBeTruthy();
  });

  it("asks for more only while more pages exist, a handler is given and nothing loads", () => {
    const onLoadMore = vi.fn();
    const { rerender } = render(<Table {...baseProps} hasMore onLoadMore={onLoadMore} />);
    (received.list["onEndReached"] as () => void)();
    expect(onLoadMore).toHaveBeenCalledTimes(1);
    rerender(<Table {...baseProps} hasMore isLoading onLoadMore={onLoadMore} />);
    expect(received.list["onEndReached"]).toBeUndefined();
    rerender(<Table {...baseProps} onLoadMore={onLoadMore} />);
    expect(received.list["onEndReached"]).toBeUndefined();
    rerender(<Table {...baseProps} hasMore />);
    expect(received.list["onEndReached"]).toBeUndefined();
  });

  it("accepts the web-only props and reads them as nothing, passing the rest to the list", () => {
    render(
      <Table {...baseProps} variant="secondary" isStickyHeader maxHeight="10rem" testID="orders" />,
    );
    expect(received.list).toMatchObject({ testID: "orders" });
    expect(received.list).not.toHaveProperty("variant");
    expect(received.list).not.toHaveProperty("isStickyHeader");
    expect(received.list).not.toHaveProperty("maxHeight");
  });

  it("extends the contract and refuses the list's own data, row renderer and children", () => {
    expectTypeOf<TableProps<Order>>().toExtend<TableContractProps<Order>>();
    // @ts-expect-error -- the rows are `items`, never the list's `data`
    const data: TableProps = { ...baseProps, data: [] };
    // @ts-expect-error -- cells come from `renderCell`, never the list's `renderItem`
    const renderItem: TableProps = { ...baseProps, renderItem: () => null };
    // @ts-expect-error -- rows come from `items`, never as children
    const children: TableProps = { ...baseProps, children: null };
    expect([data, renderItem, children]).toHaveLength(3);
  });
});
