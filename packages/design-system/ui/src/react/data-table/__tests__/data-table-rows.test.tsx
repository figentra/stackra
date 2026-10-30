/**
 * Stackra file contract:
 * Purpose: proves the web DataTable's row tools (wave 3): a named drag handle per record row and none on an expanded
 *          row's detail, the disclosure button and "expand all" that draw a named detail row under each row, the icon
 *          actions as hover buttons beside the menu, the same actions in a right-click menu that runs them for that row,
 *          inline edit with the DataGrid's editor (a valid value reaches `onCellEdit`, an invalid one keeps the editor
 *          open with an alert, Escape drops it), a row opened in the side panel, and every row's box ticked while
 *          "select all N" is chosen.
 * Boundary: jsdom with real HeroUI and React Aria; a drop itself is React Aria's and is not replayed here.
 * Runtime: browser
 * Governing contract: data-collection plan (owner, 2026-10-29), wave 3 (rows); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { defineIconRegistry } from "@stackra/icons";
import { IconRegistryProvider } from "@stackra/icons/react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { ChevronLeft, ChevronRight, Ellipsis, Undo2 } from "lucide-react";
import type { ReactElement } from "react";

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
];

const COLUMNS: readonly TableColumn[] = [
  { id: "number", label: "Order" },
  { id: "customer", label: "Customer" },
];

const QUERY: ResourceQuery = { search: "", filterValues: {}, sort: null };

const icons = defineIconRegistry({
  ellipsis: Ellipsis,
  "chevron-left": ChevronLeft,
  "chevron-right": ChevronRight,
  "undo-2": Undo2,
});

const baseProps = {
  label: "Orders",
  items: ORDERS,
  columns: COLUMNS,
  query: QUERY,
  onQueryChange: () => undefined,
} satisfies DataTableProps<Order>;

const draw = (ui: ReactElement) =>
  render(<IconRegistryProvider registry={icons}>{ui}</IconRegistryProvider>);

describe("DataTable row tools (web)", () => {
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
  afterEach(() => vi.unstubAllGlobals());

  it("gives every record row a drag handle named for the row, and none to a detail row", () => {
    draw(
      <DataTable
        {...baseProps}
        onReorder={vi.fn()}
        renderRowDetail={(order) => `Notes of ${order.number}`}
        defaultExpandedKeys={["o1"]}
      />,
    );
    expect(screen.getByRole("button", { name: "Drag #1001" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Drag #1002" })).toBeTruthy();
    expect(screen.getAllByRole("button", { name: /^Drag / })).toHaveLength(2);
    expect(screen.getByRole("group", { name: "Details of #1001" }).textContent).toBe(
      "Notes of #1001",
    );
  });

  it("expands a row, then every row, and collapses them all", async () => {
    const onExpandedChange = vi.fn();
    draw(
      <DataTable
        {...baseProps}
        renderRowDetail={(order) => `Notes of ${order.number}`}
        onExpandedChange={onExpandedChange}
      />,
    );
    const toggle = screen.getByRole("button", { name: "Show details of #1001" });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    await press(toggle);
    expect(onExpandedChange).toHaveBeenLastCalledWith(["o1"]);
    expect(screen.getByRole("group", { name: "Details of #1001" })).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Hide details of #1001" }).getAttribute("aria-expanded"),
    ).toBe("true");

    await press(screen.getByRole("button", { name: "Show all details" }));
    expect(onExpandedChange).toHaveBeenLastCalledWith(["o1", "o2"]);
    expect(screen.getByRole("group", { name: "Details of #1002" })).toBeTruthy();

    await press(screen.getByRole("button", { name: "Hide all details" }));
    expect(screen.queryByRole("group", { name: /^Details of/ })).toBeNull();
  });

  it("draws the icon actions as hover buttons beside the menu, which still lists them", async () => {
    const onRefund = vi.fn();
    draw(
      <DataTable
        {...baseProps}
        hasHoverActions
        rowActions={(order) => [
          { id: "refund", label: "Refund", icon: "undo-2", onPress: () => onRefund(order.id) },
          { id: "note", label: "Add note" },
        ]}
      />,
    );
    const row = screen.getAllByRole("row")[2] as HTMLElement;
    const refund = within(row).getByRole("button", { name: "Refund" });
    expect(within(row).queryByRole("button", { name: "Add note" })).toBeNull();
    expect(within(row).getByRole("button", { name: "Actions for #1002" })).toBeTruthy();
    await press(refund);
    expect(onRefund).toHaveBeenCalledWith("o2");
  });

  it("opens the row's actions on a right-click and runs the one chosen for that row", async () => {
    const onRefund = vi.fn();
    draw(
      <DataTable
        {...baseProps}
        rowActions={(order) => [
          { id: "refund", label: "Refund", onPress: () => onRefund(order.id) },
        ]}
      />,
    );
    const cell = screen.getByRole("gridcell", { name: "Grace" });
    await act(async () => {
      fireEvent.contextMenu(cell);
    });
    const item = await screen.findByRole("menuitem", { name: "Refund" });
    await press(item);
    expect(onRefund).toHaveBeenCalledWith("o2");
  });

  it("leaves the browser's own menu on a right-click outside a record row", async () => {
    draw(<DataTable {...baseProps} rowActions={() => [{ id: "refund", label: "Refund" }]} />);
    const header = screen.getByRole("columnheader", { name: "Order" });
    const event = new MouseEvent("contextmenu", { bubbles: true, cancelable: true });
    await act(async () => {
      header.dispatchEvent(event);
    });
    expect(event.defaultPrevented).toBe(false);
    expect(screen.queryByRole("menuitem", { name: "Refund" })).toBeNull();
  });

  it("edits a marked cell with the DataGrid's editor and hands a valid value to the app", async () => {
    const onCellEdit = vi.fn();
    draw(
      <DataTable
        {...baseProps}
        editableColumns={[{ id: "customer", label: "Customer", isRequired: true }]}
        onCellEdit={onCellEdit}
      />,
    );
    expect(screen.queryByRole("button", { name: /Edit Order of/ })).toBeNull();
    await press(screen.getByRole("button", { name: /Edit Customer of #1001/ }));
    const input = screen.getByRole("textbox", { name: "Edit Customer of #1001" });
    expect((input as HTMLInputElement).value).toBe("Ada");

    fireEvent.change(input, { target: { value: "" } });
    fireEvent.keyDown(input, { key: "Enter" });
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).not.toBe("");
    expect(onCellEdit).not.toHaveBeenCalled();
    // The message sits inside the editor's box (never over the next row) and describes the input.
    expect(alert.closest("[data-slot=data-table-cell-editor]")).toBeTruthy();
    const refused = screen.getByRole("textbox", { name: "Edit Customer of #1001" });
    expect(refused.getAttribute("aria-invalid")).toBe("true");
    expect(refused.getAttribute("aria-describedby")).toBe(alert.id);

    const again = screen.getByRole("textbox", { name: "Edit Customer of #1001" });
    fireEvent.change(again, { target: { value: "Zed" } });
    fireEvent.keyDown(again, { key: "Enter" });
    expect(onCellEdit).toHaveBeenCalledWith(ORDERS[0], "customer", "Zed");
    expect(screen.queryByRole("textbox", { name: "Edit Customer of #1001" })).toBeNull();
  });

  it("drops an edit on Escape", async () => {
    const onCellEdit = vi.fn();
    draw(
      <DataTable
        {...baseProps}
        editableColumns={[{ id: "customer", label: "Customer" }]}
        onCellEdit={onCellEdit}
      />,
    );
    await press(screen.getByRole("button", { name: /Edit Customer of #1002/ }));
    const input = screen.getByRole("textbox", { name: "Edit Customer of #1002" });
    fireEvent.change(input, { target: { value: "Nobody" } });
    fireEvent.keyDown(input, { key: "Escape" });
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(onCellEdit).not.toHaveBeenCalled();
  });

  it("opens a pressed row in the side panel and tells the app", async () => {
    const onRowOpen = vi.fn();
    draw(
      <DataTable
        {...baseProps}
        onRowOpen={onRowOpen}
        renderRowPanel={(order) => `Panel of ${order.number}`}
      />,
    );
    await act(async () => {
      fireEvent.click(screen.getByRole("gridcell", { name: "Grace" }));
    });
    expect(onRowOpen).toHaveBeenCalledWith(ORDERS[1]);
    expect(await screen.findByText("Panel of #1002")).toBeTruthy();
  });

  it("keeps the editor on its cell while the page scrolls", async () => {
    draw(
      <DataTable
        {...baseProps}
        editableColumns={[{ id: "customer", label: "Customer" }]}
        onCellEdit={vi.fn()}
      />,
    );
    const trigger = screen.getByRole("button", { name: /Edit Customer of #1001/ });
    const cell = trigger.closest<HTMLElement>("[role=gridcell], [role=rowheader]") as HTMLElement;
    let top = 100;
    cell.getBoundingClientRect = () => ({
      top,
      left: 10,
      width: 120,
      height: 40,
      bottom: top + 40,
      right: 130,
      x: 10,
      y: top,
      toJSON: () => ({}),
    });
    await press(trigger);
    const editor = document.querySelector<HTMLElement>("[data-slot=data-table-cell-editor]");
    expect(editor?.style.top).toBe("100px");
    top = 40;
    await act(async () => {
      window.dispatchEvent(new Event("scroll"));
      await new Promise((resolve) => {
        requestAnimationFrame(resolve);
      });
    });
    expect(editor?.style.top).toBe("40px");
  });

  it("ticks every row's box while every matching record is chosen", () => {
    draw(
      <DataTable
        {...baseProps}
        selectionMode="multiple"
        selectedKeys={[]}
        totalCount={240}
        isAllMatchingSelected
        onAllMatchingSelectedChange={() => undefined}
      />,
    );
    const boxes = screen
      .getAllByRole("checkbox")
      .filter((box) => box.closest("[role=row]")?.querySelector("[role=rowheader]"));
    expect(boxes).toHaveLength(2);
    for (const box of boxes) expect((box as HTMLInputElement).checked).toBe(true);
  });
});
