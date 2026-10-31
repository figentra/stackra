/**
 * Stackra file contract:
 * Purpose: proves the web Table names its grid by `label`, draws a header per column and a row per item with the text of
 *          the property each column's id names or `renderCell`'s content, makes the first column (or the chosen one) the
 *          row header, marks the sorted header with `aria-sort` and reports a press on a sortable header as the sort it
 *          asks for without reordering the rows, adds a checkbox column for several selected rows and selects on a row
 *          press for one, reports every selection as a list of ids in the items' order (select-all included) whether
 *          controlled or not, shows `emptyState` only when nothing loads and a spinner with one status message while
 *          rows load, both in a named group in place of a grid with no rows, adds the load-more sentinel only when more pages exist, pins a sticky header, passes the root's
 *          other props through, and refuses HeroUI's selected key, a `Set` of keys and children.
 * Boundary: jsdom with real HeroUI and React Aria; the theme CSS is not loaded, so classes are checked, not looks.
 *           jsdom has no IntersectionObserver, which the load-more sentinel needs, so a stand-in is installed.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0313; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-123
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { I18nProvider } from "react-aria-components";

import type { SortDescriptor } from "#contracts/types/sort-descriptor.type";
import type { TableColumn } from "#contracts/types/table-column.type";
import type { TableContractProps } from "#contracts/types/table-contract-props.type";
import { Table } from "#react/table/table";
import type { TableProps } from "#react/table/table.props";

const press = (element: HTMLElement) => act(() => element.click());

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
  { id: "total", label: "Total", isSortable: true, align: "end" },
];

const baseProps = { label: "Orders", items: ORDERS, columns: COLUMNS } as const;

describe("Table (web)", () => {
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

  it("names the grid by its label and draws a header per column and a row per item", () => {
    render(<Table {...baseProps} />);
    const grid = screen.getByRole("grid", { name: "Orders" });
    expect(
      within(grid)
        .getAllByRole("columnheader")
        .map((header) => header.textContent),
    ).toEqual(["Customer", "Total"]);
    expect(within(grid).getAllByRole("row")).toHaveLength(1 + ORDERS.length);
    expect(within(grid).getByRole("gridcell", { name: "30" })).toBeTruthy();
  });

  it("shows the property each column names, and what renderCell returns when given", () => {
    const { rerender } = render(<Table {...baseProps} />);
    expect(screen.getByText("Grace")).toBeTruthy();
    rerender(
      <Table
        {...baseProps}
        renderCell={(item, column) =>
          column.id === "total" ? <strong>{`$${item.total}`}</strong> : item.customer
        }
      />,
    );
    expect(screen.getByText("$30").tagName).toBe("STRONG");
  });

  it("makes the first column the row header unless the app chose another", () => {
    const { rerender } = render(<Table {...baseProps} />);
    expect(screen.getByRole("rowheader", { name: "Ada" })).toBeTruthy();
    expect(screen.queryByRole("rowheader", { name: "12" })).toBeNull();
    rerender(
      <Table
        {...baseProps}
        columns={[
          { id: "customer", label: "Customer" },
          { id: "total", label: "Total", isRowHeader: true },
        ]}
      />,
    );
    expect(screen.getByRole("rowheader", { name: "12" })).toBeTruthy();
  });

  it("marks the sorted header and reports a press on a sortable one as the sort it asks for", () => {
    const onSortChange = vi.fn<(sort: SortDescriptor) => void>();
    const { rerender } = render(
      <Table
        {...baseProps}
        sort={[{ column: "total", direction: "ascending" }]}
        onSortChange={onSortChange}
      />,
    );
    const customer = screen.getByRole("columnheader", { name: "Customer" });
    const total = screen.getByRole("columnheader", { name: "Total" });
    expect(total.getAttribute("aria-sort")).toBe("ascending");
    expect(customer.getAttribute("aria-sort")).toBe("none");

    press(customer);
    expect(onSortChange).toHaveBeenLastCalledWith({ column: "customer", direction: "ascending" });
    press(total);
    expect(onSortChange).toHaveBeenLastCalledWith({ column: "total", direction: "descending" });

    // The table never sorts what it was given: the controlled descriptor decides the mark, the rows keep their order.
    rerender(
      <Table
        {...baseProps}
        sort={[{ column: "total", direction: "descending" }]}
        onSortChange={onSortChange}
      />,
    );
    expect(screen.getByRole("columnheader", { name: "Total" }).getAttribute("aria-sort")).toBe(
      "descending",
    );
    expect(screen.getAllByRole("rowheader").map((cell) => cell.textContent)).toEqual([
      "Ada",
      "Grace",
      "Linus",
    ]);
  });

  it("gives a column that is not sortable no sort to ask for", () => {
    const onSortChange = vi.fn();
    render(
      <Table
        {...baseProps}
        columns={[{ id: "customer", label: "Customer" }]}
        onSortChange={onSortChange}
      />,
    );
    press(screen.getByRole("columnheader", { name: "Customer" }));
    expect(onSortChange).not.toHaveBeenCalled();
  });

  it("has no selection column and no selected rows by default", () => {
    render(<Table {...baseProps} />);
    expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
    press(screen.getByRole("row", { name: /Ada/ }));
    expect(document.querySelectorAll('[aria-selected="true"]')).toHaveLength(0);
  });

  it("adds a checkbox column for several and reports the ids in the items' order", () => {
    const onSelectionChange = vi.fn<(keys: readonly string[]) => void>();
    render(<Table {...baseProps} selectionMode="multiple" onSelectionChange={onSelectionChange} />);
    const boxes = screen.getAllByRole("checkbox");
    // One to select all, and one per row.
    expect(boxes).toHaveLength(1 + ORDERS.length);

    press(boxes[3] as HTMLElement);
    expect(onSelectionChange).toHaveBeenLastCalledWith(["o3"]);
    press(boxes[1] as HTMLElement);
    expect(onSelectionChange).toHaveBeenLastCalledWith(["o1", "o3"]);
    expect(screen.getByRole("row", { name: /Ada/ }).getAttribute("aria-selected")).toBe("true");
  });

  it("reports select-all as every id, never as the string all", () => {
    const onSelectionChange = vi.fn<(keys: readonly string[]) => void>();
    render(<Table {...baseProps} selectionMode="multiple" onSelectionChange={onSelectionChange} />);
    press(screen.getAllByRole("checkbox")[0] as HTMLElement);
    expect(onSelectionChange).toHaveBeenLastCalledWith(["o1", "o2", "o3"]);
  });

  it("starts from defaultSelectedKeys and follows selectedKeys when controlled", () => {
    const { rerender } = render(
      <Table {...baseProps} selectionMode="multiple" defaultSelectedKeys={["o2"]} />,
    );
    expect(screen.getByRole("row", { name: /Grace/ }).getAttribute("aria-selected")).toBe("true");
    rerender(<Table {...baseProps} selectionMode="multiple" selectedKeys={["o3"]} />);
    expect(screen.getByRole("row", { name: /Linus/ }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("row", { name: /Grace/ }).getAttribute("aria-selected")).toBe("false");
  });

  it("selects the pressed row for one, with no checkbox column", () => {
    const onSelectionChange = vi.fn<(keys: readonly string[]) => void>();
    render(<Table {...baseProps} selectionMode="single" onSelectionChange={onSelectionChange} />);
    expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
    press(screen.getByRole("row", { name: /Grace/ }));
    expect(onSelectionChange).toHaveBeenLastCalledWith(["o2"]);
    press(screen.getByRole("row", { name: /Linus/ }));
    expect(onSelectionChange).toHaveBeenLastCalledWith(["o3"]);
    expect(document.querySelectorAll('[aria-selected="true"]')).toHaveLength(1);
  });

  it("shows the empty state only when there are no rows and nothing loads", () => {
    const { rerender } = render(
      <Table {...baseProps} items={[]} emptyState={<p>No orders yet</p>} />,
    );
    expect(screen.getByText("No orders yet")).toBeTruthy();
    expect(
      within(screen.getByRole("group", { name: "Orders" })).getByText("No orders yet"),
    ).toBeTruthy();
    rerender(<Table {...baseProps} items={[]} emptyState={<p>No orders yet</p>} isLoading />);
    expect(screen.queryByText("No orders yet")).toBeNull();
    rerender(<Table {...baseProps} emptyState={<p>No orders yet</p>} />);
    expect(screen.queryByText("No orders yet")).toBeNull();
  });

  it("draws no empty row when there is no empty state to show", () => {
    render(<Table {...baseProps} items={[]} />);
    expect(within(screen.getByRole("grid")).getAllByRole("row")).toHaveLength(1);
  });

  it("stands a spinner in for the grid and says what loads once, through one status message", () => {
    render(<Table {...baseProps} items={[]} isLoading loadingLabel="Loading orders" />);
    const status = screen.getByRole("status");
    expect(status.textContent).toBe("Loading orders");
    expect(screen.getAllByText("Loading orders")).toHaveLength(2);
    expect(document.querySelector('[data-slot="spinner"]')).toBeTruthy();
    // A grid with no rows has headers with no data cell to describe, so a named group takes its place.
    expect(screen.queryByRole("grid")).toBeNull();
    expect(
      screen
        .getByRole("group", { name: "Orders" })
        .closest('[data-slot="table"]')
        ?.getAttribute("aria-busy"),
    ).toBe("true");
  });

  it("is silent and not busy when nothing loads", () => {
    render(<Table {...baseProps} />);
    expect(screen.getByRole("status").textContent).toBe("");
    expect(screen.getByRole("grid").closest('[data-slot="table"]')?.hasAttribute("aria-busy")).toBe(
      false,
    );
  });

  it("keeps the rows and shows a loading line after them while a reload runs", () => {
    render(<Table {...baseProps} isLoading />);
    expect(screen.getByRole("rowheader", { name: "Ada" })).toBeTruthy();
    // The loading line's words, and the one live status that says them aloud.
    expect(screen.getAllByText("Loading")).toHaveLength(2);
    expect(screen.getByRole("status").textContent).toBe("Loading");
  });

  it("adds the load-more sentinel only while more pages exist and a handler is given", () => {
    const { rerender } = render(<Table {...baseProps} hasMore onLoadMore={() => undefined} />);
    expect(document.querySelector('[data-testid="loadMoreSentinel"]')).toBeTruthy();
    rerender(<Table {...baseProps} hasMore={false} onLoadMore={() => undefined} />);
    expect(document.querySelector('[data-testid="loadMoreSentinel"]')).toBeNull();
    rerender(<Table {...baseProps} hasMore />);
    expect(document.querySelector('[data-testid="loadMoreSentinel"]')).toBeNull();
  });

  it("pins a sticky header and scrolls the rows inside maxHeight", () => {
    const { rerender } = render(<Table {...baseProps} isStickyHeader maxHeight="10rem" />);
    const scroller = document.querySelector<HTMLElement>('[data-slot="table-scroll-container"]');
    // The header plus whole rows, so a sticky total row never covers part of one.
    expect(scroller?.style.maxHeight).toBe(
      "calc(var(--size-table-header) + round(down, 10rem - var(--size-table-header), 44px))",
    );
    for (const header of screen.getAllByRole("columnheader"))
      expect(header.classList.contains("sticky")).toBe(true);
    rerender(<Table {...baseProps} />);
    expect(
      document.querySelector<HTMLElement>('[data-slot="table-scroll-container"]')?.style.maxHeight,
    ).toBe("");
  });

  it("gives the sticky header's default height when none is given", () => {
    render(<Table {...baseProps} isStickyHeader />);
    expect(
      document.querySelector<HTMLElement>('[data-slot="table-scroll-container"]')?.style.maxHeight,
    ).toBe("calc(var(--size-table-header) + round(down, 24rem - var(--size-table-header), 44px))");
  });

  it("draws HeroUI's two variants", () => {
    const { rerender } = render(<Table {...baseProps} />);
    expect(
      document.querySelector('[data-slot="table"]')?.classList.contains("table-root--primary"),
    ).toBe(true);
    rerender(<Table {...baseProps} variant="secondary" />);
    expect(
      document.querySelector('[data-slot="table"]')?.classList.contains("table-root--secondary"),
    ).toBe(true);
  });

  it("lines a column's cells up by its align", () => {
    render(<Table {...baseProps} />);
    expect(screen.getByRole("gridcell", { name: "12" }).classList.contains("text-end")).toBe(true);
    expect(screen.getByRole("rowheader", { name: "Ada" }).classList.contains("text-start")).toBe(
      true,
    );
  });

  it("walks the cells with the arrow keys and lands on a cell's button", () => {
    render(
      <Table
        {...baseProps}
        renderCell={(item, column) =>
          column.id === "total" ? (
            <button type="button">{`Open ${item.customer}`}</button>
          ) : (
            item.customer
          )
        }
      />,
    );
    const ada = screen.getByRole("rowheader", { name: "Ada" });
    act(() => ada.focus());
    fireEvent.keyDown(document.activeElement as Element, { key: "ArrowRight" });
    // React Aria's "arrow" behaviour: the cell hands focus to its button, so the button is reached from the keyboard.
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Open Ada" }));
  });

  it("draws a move grip on every column but the fixed ones", () => {
    const { container } = render(
      <Table {...baseProps} onColumnMove={() => undefined} fixedColumns={["total"]} />,
    );
    const grips = [...container.querySelectorAll("[role=columnheader] .cursor-grab")];
    expect(grips).toHaveLength(1);
    expect(grips[0]?.closest("[role=columnheader]")?.textContent).toContain("Customer");
  });

  it("lets the last scrolling column take the rest of the row when every column has a width", () => {
    // jsdom lays nothing out: the resizable container is 800 px wide here.
    for (const key of ["clientWidth", "offsetWidth"] as const)
      vi.spyOn(HTMLElement.prototype, key, "get").mockReturnValue(800);
    const { container } = render(
      <Table
        {...baseProps}
        columns={COLUMNS.map((column) => ({ ...column, width: 150 }))}
        isColumnResizable
      />,
    );
    // React Aria lays a fraction column out from the free width; a fixed one keeps its pixels.
    const headers = [...container.querySelectorAll<HTMLElement>("[role=columnheader]")];
    expect(headers[0]?.style.width).toBe("150px");
    expect(headers[1]?.style.width).toBe("650px");
    vi.restoreAllMocks();
  });

  it("draws only the rows in view when virtualised, and names them all to assistive technology", () => {
    for (const key of ["clientWidth", "offsetWidth"] as const)
      vi.spyOn(HTMLElement.prototype, key, "get").mockReturnValue(800);
    for (const key of ["clientHeight", "offsetHeight"] as const)
      vi.spyOn(HTMLElement.prototype, key, "get").mockReturnValue(400);
    const many = Array.from({ length: 5000 }, (_, index) => ({
      id: `o${index}`,
      customer: `Customer ${index}`,
      total: index,
    }));
    render(<Table {...baseProps} items={many} isVirtualized maxHeight="400px" />);
    const grid = screen.getByRole("grid", { name: "Orders" });
    expect(grid.getAttribute("aria-rowcount")).toBe("5001");
    const drawn = within(grid).getAllByRole("row").length;
    expect(drawn).toBeGreaterThan(1);
    expect(drawn).toBeLessThan(60);
    vi.restoreAllMocks();
  });

  it("lays a virtualised row out from the right in right to left, pinned cells first and never over the next", () => {
    for (const key of ["clientWidth", "offsetWidth"] as const)
      vi.spyOn(HTMLElement.prototype, key, "get").mockReturnValue(800);
    for (const key of ["clientHeight", "offsetHeight"] as const)
      vi.spyOn(HTMLElement.prototype, key, "get").mockReturnValue(400);
    render(
      <I18nProvider locale="ar">
        <Table
          {...baseProps}
          columns={[
            { id: "customer", label: "Customer", width: 160, pin: "start" },
            { id: "total", label: "Total", width: 120 },
          ]}
          selectionMode="multiple"
          isVirtualized
          maxHeight="400px"
        />
      </I18nProvider>,
    );
    const row = screen.getByRole("row", { name: /Ada/ });
    // Each cell sits in React Aria's box; in right to left the box is placed by `right`, never `left`.
    const boxes = [...row.children].map((box) => (box as HTMLElement).style);
    expect(boxes.map((box) => box.left)).toEqual(["", "", ""]);
    const spans = boxes.map((box) => [Number.parseFloat(box.right), Number.parseFloat(box.width)]);
    expect(spans.map(([right]) => right)).toEqual([0, 44, 44 + (spans[1]?.[1] ?? 0)]);
    // The boxes and the start pin stick; each ends where the next begins.
    expect(boxes.slice(0, 2).map((box) => box.position)).toEqual(["sticky", "sticky"]);
    for (let index = 1; index < spans.length; index++) {
      const [right = 0, width = 0] = spans[index - 1] ?? [];
      expect(right + width).toBeLessThanOrEqual(spans[index]?.[0] ?? 0);
    }
    vi.restoreAllMocks();
  });

  it("passes the root's other props through", () => {
    render(<Table {...baseProps} data-testid="orders-table" className="extra" id="orders" />);
    const root = screen.getByTestId("orders-table");
    expect(root.classList.contains("extra")).toBe(true);
    expect(root.id).toBe("orders");
  });

  it("extends the contract and refuses HeroUI's selected key, a Set of keys and children", () => {
    expectTypeOf<TableProps<Order>>().toExtend<TableContractProps<Order>>();
    // @ts-expect-error -- the selection is `selectedKeys` as a list of ids, never React Aria's `selectedKey`
    const selectedKey: TableProps = { ...baseProps, selectedKey: "o1" };
    // @ts-expect-error -- ids are strings in a list; a `Set` is React Aria's shape
    const aSet: TableProps = { ...baseProps, selectedKeys: new Set(["o1"]) };
    // @ts-expect-error -- rows come from `items`, never as children
    const children: TableProps = { ...baseProps, children: <tr /> };
    expect([selectedKey, aSet, children]).toHaveLength(3);
  });
});
