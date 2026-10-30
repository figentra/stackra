/**
 * Stackra file contract:
 * Purpose: proves the web `ColumnEditor`: it lists every column in a grid with a named drag handle and a named "show"
 *          box (the row header's disabled); unticking hides a column; opening a row renames it, pins it and sets or
 *          fits its width; "Reset columns" puts all back.
 * Boundary: the editor over a real `useCollection`, read back through the engine's resolved columns.
 * Runtime: node
 * Governing contract: data-collection plan (owner, 2026-10-29); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { fireEvent, render, screen, within } from "@testing-library/react";

import type { CollectionColumn } from "#contracts/types/collection-column.type";
import { ColumnEditor } from "#react/column-chooser/column-editor";
import { useCollection } from "#react/hooks/use-collection";

const COLUMNS: readonly CollectionColumn[] = [
  { id: "order", label: "Order" },
  { id: "customer", label: "Customer" },
  { id: "total", label: "Total", type: "number" },
];
const ROWS = [{ id: "1", order: "#1001", customer: "Al Noor Trading Establishment", total: 5 }];

/** The editor and a readout of the engine's columns. */
function Harness() {
  const collection = useCollection({ columns: COLUMNS, items: ROWS });
  return (
    <>
      <ColumnEditor collection={collection} />
      <output data-testid="columns">
        {collection.columns
          .map((column) => `${column.label}${column.isHidden ? "-hidden" : ""}${column.pin ? `-${column.pin}` : ""}${column.width ? `-${column.width}` : ""}`)
          .join(",")}
      </output>
    </>
  );
}

const readout = () => screen.getByTestId("columns").textContent;

/** Opens the popover. */
function open() {
  fireEvent.click(screen.getByRole("button", { name: "Columns" }));
  return screen.getByRole("grid", { name: "Columns" });
}

describe("ColumnEditor (web)", () => {
  it("lists every column with a drag handle and a show box, the row header's disabled", () => {
    render(<Harness />);
    const grid = open();
    expect(within(grid).getAllByRole("row")).toHaveLength(3);
    expect(screen.getByRole("button", { name: "Reorder Customer" })).toBeTruthy();
    expect((screen.getByRole("checkbox", { name: /^Show Order/ }) as HTMLInputElement).disabled).toBe(true);
  });

  it("hides a column when its box is unticked", () => {
    render(<Harness />);
    open();
    fireEvent.click(screen.getByRole("checkbox", { name: /^Show Customer/ }));
    expect(readout()).toBe("Order,Customer-hidden,Total");
  });

  it("renames, pins and sizes the opened column", () => {
    render(<Harness />);
    const grid = open();
    expect(within(grid).getAllByRole("row")).toHaveLength(3);
    fireEvent.click(screen.getByRole("button", { name: "Rename Total" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Column name" }), { target: { value: "المبلغ" } });
    expect(readout()).toContain("المبلغ");
    fireEvent.click(screen.getByRole("radio", { name: "Pin to start" }));
    expect(readout()).toBe("المبلغ-start,Order,Customer");
    fireEvent.click(screen.getByRole("button", { name: "Fit to content" }));
    expect(readout()).toMatch(/^المبلغ-start-\d+,/);
    fireEvent.click(screen.getByRole("button", { name: "Reset columns" }));
    expect(readout()).toBe("Order,Customer,Total");
  });
});
