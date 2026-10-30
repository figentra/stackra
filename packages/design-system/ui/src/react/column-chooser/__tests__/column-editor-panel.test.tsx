/**
 * Stackra file contract:
 * Purpose: proves the web `ColumnEditorPanel` beyond the popover: the drag handle reorders columns from the keyboard;
 *          the rename button toggles the row's editor; pin to end and back to none, a typed width, clearing it, and
 *          the wrap switch all reach the engine; a pinned column shows its pin. Also proves the plain `ColumnChooser`:
 *          ticking a box reports the hidden columns, never the row header.
 * Boundary: the panel over a real `useCollection`, read back through the engine's resolved columns, in jsdom.
 * Runtime: browser
 * Governing contract: data-collection plan (owner, 2026-10-29); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";

import type { CollectionColumn } from "#contracts/types/collection-column.type";
import { ColumnChooser } from "#react/column-chooser/column-chooser";
import { ColumnEditorPanel } from "#react/column-chooser/column-editor-panel";
import { useCollection } from "#react/hooks/use-collection";

const press = (element: HTMLElement) => act(() => element.click());

const COLUMNS: readonly CollectionColumn[] = [
  { id: "order", label: "Order" },
  { id: "customer", label: "Customer" },
  { id: "total", label: "Total", type: "number" },
];
const ROWS = [{ id: "1", order: "#1001", customer: "Najd", total: 5 }];

/** The panel and a readout of the engine's columns. */
function Harness() {
  const collection = useCollection({ columns: COLUMNS, items: ROWS });
  return (
    <>
      <ColumnEditorPanel collection={collection} label="Fields" />
      <output data-testid="columns">
        {collection.columns
          .map(
            (column) =>
              `${column.label}${column.pin ? `-${column.pin}` : ""}${column.width ? `-${column.width}` : ""}${column.wrap ? "-wrap" : ""}`,
          )
          .join(",")}
      </output>
    </>
  );
}

const readout = () => screen.getByTestId("columns").textContent;

describe("ColumnEditorPanel (web)", () => {
  // Only with the other columns hidden: the grid's selection is the shown set, and React Aria drags every selected
  // row, so with all shown a drag moves them all and the order stays (a reported bug, STA-1371).
  it("reorders a lone shown column from the keyboard by its drag handle", () => {
    vi.useFakeTimers();
    try {
      render(<Harness />);
      expect(screen.getByRole("grid", { name: "Fields" })).toBeTruthy();
      fireEvent.click(screen.getByRole("checkbox", { name: /^Show Customer/ }));
      fireEvent.click(screen.getByRole("checkbox", { name: /^Show Total/ }));
      const handle = screen.getByRole("button", { name: "Reorder Order" });
      act(() => handle.focus());
      fireEvent.keyDown(handle, { key: "Enter" });
      fireEvent.keyUp(handle, { key: "Enter" });
      act(() => vi.runAllTimers());
      for (const key of ["ArrowDown", "ArrowDown", "Enter"]) {
        fireEvent.keyDown(document.activeElement ?? document.body, { key });
        fireEvent.keyUp(document.activeElement ?? document.body, { key });
      }
      act(() => vi.runAllTimers());
      expect(readout()).toBe("Customer,Total,Order");
    } finally {
      vi.useRealTimers();
    }
  });

  it("toggles a row's editor and sets pin, width and wrap", () => {
    render(<Harness />);
    const rename = screen.getByRole("button", { name: "Rename Customer" });
    press(rename);
    expect(screen.getByRole("group", { name: "Customer" })).toBeTruthy();
    expect((screen.getByRole("textbox", { name: "Column name" }) as HTMLInputElement).value).toBe(
      "",
    );
    press(screen.getByRole("radio", { name: "Pin to end" }));
    expect(readout()).toBe("Order,Total,Customer-end");
    expect(screen.getByTitle("Pin to end")).toBeTruthy();
    press(screen.getByRole("radio", { name: "Not pinned" }));
    expect(readout()).toBe("Order,Customer,Total");
    const width = screen.getByRole("textbox", { name: "Width" });
    fireEvent.change(width, { target: { value: "200" } });
    fireEvent.blur(width);
    expect(readout()).toBe("Order,Customer-200,Total");
    fireEvent.change(width, { target: { value: "" } });
    fireEvent.blur(width);
    expect(readout()).toBe("Order,Customer,Total");
    press(screen.getByRole("switch", { name: "Wrap text" }));
    expect(readout()).toBe("Order,Customer-wrap,Total");
    press(screen.getByRole("button", { name: "Rename Customer" }));
    expect(screen.queryByRole("group", { name: "Customer" })).toBeNull();
  });
});

describe("ColumnChooser (web)", () => {
  it("reports the unticked columns as hidden and keeps the row header shown", () => {
    const onHiddenColumnsChange = vi.fn();
    render(
      <ColumnChooser
        label="Show"
        columns={[
          { id: "order", label: "Order" },
          { id: "customer", label: "Customer", isRowHeader: true },
          { id: "total", label: "Total" },
        ]}
        hiddenColumns={["total"]}
        onHiddenColumnsChange={onHiddenColumnsChange}
      />,
    );
    press(screen.getByRole("button", { name: "Show" }));
    expect((screen.getByRole("checkbox", { name: "Customer" }) as HTMLInputElement).disabled).toBe(
      true,
    );
    expect((screen.getByRole("checkbox", { name: "Total" }) as HTMLInputElement).checked).toBe(
      false,
    );
    fireEvent.click(screen.getByRole("checkbox", { name: "Order" }));
    expect(onHiddenColumnsChange).toHaveBeenLastCalledWith(["order", "total"]);
  });

  it("names itself Columns by default", () => {
    render(
      <ColumnChooser
        columns={[{ id: "a", label: "A" }]}
        hiddenColumns={[]}
        onHiddenColumnsChange={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "Columns" })).toBeTruthy();
  });
});
