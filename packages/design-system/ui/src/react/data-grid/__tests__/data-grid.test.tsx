/**
 * Stackra file contract:
 * Purpose: proves the web DataGrid draws a named grid with its headers, edits a cell by typing (Enter commits and
 *          moves down), pastes tab-separated text over a block, flags an invalid value, undoes, saves the pending
 *          changes through `onSave` and draws a matrix's totals; it draws a `useCollection` engine's rows (so the engine
 *          sorts) and pins the shorthand's first column.
 * Boundary: jsdom with real HeroUI; virtualisation and the fill handle drag are not exercised.
 * Runtime: browser
 * Governing contract: ADR 0317 amendment 2026-10-28 (wave 3d, DataGrid); ADR 0505; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";

import type { CollectionColumn } from "#contracts/types/collection-column.type";
import { DataGrid } from "#react/data-grid/data-grid";
import { useCollection } from "#react/hooks/use-collection";

const COLUMNS: CollectionColumn[] = [
  { id: "name", label: "Name" },
  { id: "qty", label: "Qty", type: "number", min: 0 },
];
const ROWS = [
  { id: "a", name: "Latte", qty: 1 },
  { id: "b", name: "Mocha", qty: 2 },
];

function paste(grid: HTMLElement, text: string) {
  fireEvent.paste(grid, { clipboardData: { getData: () => text } });
}

function Sorted() {
  const collection = useCollection({
    columns: COLUMNS,
    items: ROWS,
    initialState: { sort: [{ column: "qty", direction: "descending" }] },
  });
  return <DataGrid label="Menu" collection={collection} />;
}

describe("DataGrid (web)", () => {
  it("draws a named grid with its column headers", () => {
    render(<DataGrid label="Menu" columns={COLUMNS} items={ROWS} />);
    expect(screen.getByRole("grid", { name: "Menu" })).toBeTruthy();
    expect(screen.getAllByRole("columnheader").map((cell) => cell.textContent)).toEqual([
      "Name",
      "Qty",
    ]);
  });

  it("pins the shorthand's first column to the start", () => {
    render(<DataGrid label="Menu" columns={COLUMNS} items={ROWS} />);
    expect((screen.getAllByRole("columnheader")[0] as HTMLElement).style.position).toBe("sticky");
  });

  it("draws the engine's rows, so its sort applies", () => {
    render(<Sorted />);
    expect(screen.getAllByRole("rowheader")[0]?.textContent).toBe("Mocha");
  });

  it("edits by typing, flags a bad value, pastes a block, undoes and saves", async () => {
    const onSave = vi.fn();
    render(<DataGrid label="Menu" columns={COLUMNS} items={ROWS} onSave={onSave} />);
    const grid = screen.getByRole("grid");
    grid.focus();
    fireEvent.keyDown(grid, { key: "ArrowRight" });
    fireEvent.keyDown(grid, { key: "5" });
    const input = screen.getByRole("textbox");
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByRole("region")).toBeTruthy();

    paste(grid, "x\n7\n");
    expect(grid.querySelector("[aria-invalid=true]")).toBeTruthy();
    fireEvent.keyDown(grid, { key: "z", ctrlKey: true });
    expect(grid.querySelector("[aria-invalid=true]")).toBeNull();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /save/i }));
    });
    expect(onSave).toHaveBeenCalledWith({ a: { qty: 5 } });
  });

  it("totals a matrix by row and column", () => {
    render(
      <DataGrid
        label="Stock"
        variant="matrix"
        columns={[
          { id: "colour", label: "Colour" },
          { id: "s", label: "S" },
          { id: "m", label: "M" },
        ]}
        items={[
          { id: "red", colour: "Red", s: 1, m: 2 },
          { id: "blue", colour: "Blue", s: 3, m: 4 },
        ]}
      />,
    );
    const rows = screen.getAllByRole("row");
    expect(rows.at(-1)?.textContent).toContain("10");
    expect(rows[1]?.textContent).toContain("3");
  });
});
