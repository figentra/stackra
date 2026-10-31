/**
 * Stackra file contract:
 * Purpose: proves the web DataGrid's spreadsheet keys and pointer: the arrows (mirrored in RTL), Home, End, Page,
 *          Tab and their command forms move the active cell, Shift extends the range and Escape collapses it,
 *          Ctrl+A selects all, Ctrl+D fills down, Delete clears, Space toggles a boolean range, F2 and a double click
 *          edit, the editor commits by Enter, Shift+Enter, Tab and blur and cancels by Escape, a select cell edits by
 *          its choice, copy and cut put tab-separated text on the clipboard, redo returns an undone edit, and a
 *          pointer drag selects a range while the fill handle repeats it down or across.
 * Boundary: jsdom with real HeroUI; jsdom has no layout, so `elementFromPoint` is pointed at the cell by hand.
 * Runtime: browser
 * Governing contract: ADR 0317 amendment 2026-10-28 (wave 3d, DataGrid); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import { I18nProvider } from "react-aria-components";

import type { CollectionColumn } from "#contracts/types/collection-column.type";
import { DataGrid } from "#react/data-grid/data-grid";

const COLUMNS: CollectionColumn[] = [
  { id: "name", label: "Name" },
  { id: "qty", label: "Qty", type: "number" },
  { id: "on", label: "On", type: "boolean" },
  {
    id: "size",
    label: "Size",
    type: "choice",
    options: [
      { id: "s", label: "Small" },
      { id: "l", label: "Large" },
    ],
  },
];
const ROWS = [
  { id: "a", name: "Latte", qty: 1, on: false, size: "s" },
  { id: "b", name: "Mocha", qty: 2, on: false, size: "s" },
  { id: "c", name: "Chai", qty: 3, on: true, size: "l" },
];

const gridOf = () => screen.getByRole("grid");
const key = (init: KeyboardEventInit) => fireEvent.keyDown(gridOf(), init);
/** The active cell as "row:column". */
const active = () =>
  document
    .getElementById(gridOf().getAttribute("aria-activedescendant") ?? "")
    ?.getAttribute("data-cell");
const cell = (at: string) =>
  gridOf().querySelector<HTMLElement>(`[data-cell="${at}"]`) as HTMLElement;
const selected = () =>
  [...gridOf().querySelectorAll('[aria-selected="true"]')].map((element) =>
    element.getAttribute("data-cell"),
  );
const over = (target: HTMLElement | null) =>
  Object.defineProperty(document, "elementFromPoint", {
    value: () => target,
    configurable: true,
  });
const clipboard = () => {
  let text = "";
  return {
    data: { setData: (_type: string, value: string) => (text = value), getData: () => text },
    text: () => text,
  };
};

describe("DataGrid keys (web)", () => {
  it("moves the active cell with the arrows, Home, End, Page and Tab", () => {
    render(<DataGrid label="Menu" columns={COLUMNS} items={ROWS} />);
    expect(active()).toBe("0:0");
    key({ key: "ArrowRight" });
    key({ key: "ArrowDown" });
    expect(active()).toBe("1:1");
    key({ key: "ArrowLeft" });
    key({ key: "ArrowUp" });
    expect(active()).toBe("0:0");
    key({ key: "ArrowDown", ctrlKey: true });
    expect(active()).toBe("2:0");
    key({ key: "ArrowUp", metaKey: true });
    key({ key: "ArrowRight", ctrlKey: true });
    expect(active()).toBe("0:3");
    key({ key: "ArrowLeft", ctrlKey: true });
    key({ key: "End" });
    expect(active()).toBe("0:3");
    key({ key: "Home" });
    key({ key: "End", ctrlKey: true });
    expect(active()).toBe("2:3");
    key({ key: "Home", ctrlKey: true });
    expect(active()).toBe("0:0");
    // A page is the rows in view, so with three rows it lands on the last.
    key({ key: "PageDown" });
    expect(active()).toBe("2:0");
    key({ key: "PageUp" });
    expect(active()).toBe("0:0");
    key({ key: "Tab" });
    expect(active()).toBe("0:1");
    key({ key: "Tab", shiftKey: true });
    // At the first column Shift+Tab leaves the grid: the active cell stays.
    key({ key: "Tab", shiftKey: true });
    expect(active()).toBe("0:0");
    key({ key: "End" });
    key({ key: "Tab" });
    expect(active()).toBe("0:3");
  });

  it("mirrors the arrows in RTL", () => {
    render(
      <I18nProvider locale="ar-SA">
        <DataGrid label="Menu" columns={COLUMNS} items={ROWS} />
      </I18nProvider>,
    );
    key({ key: "ArrowLeft" });
    expect(active()).toBe("0:1");
    key({ key: "ArrowRight" });
    expect(active()).toBe("0:0");
  });

  it("extends, collapses and selects all, fills down, clears and toggles booleans", () => {
    const onChangesChange = vi.fn();
    render(
      <DataGrid label="Menu" columns={COLUMNS} items={ROWS} onChangesChange={onChangesChange} />,
    );
    key({ key: "ArrowDown", shiftKey: true });
    expect(selected()).toEqual(["0:0", "1:0"]);
    key({ key: "Escape" });
    expect(selected()).toEqual(["1:0"]);
    key({ key: "a", ctrlKey: true });
    expect(selected()).toHaveLength(12);
    key({ key: "Escape" });
    // Fill Name down from row 0 over rows 0-2.
    key({ key: "Home", ctrlKey: true });
    key({ key: "ArrowDown", shiftKey: true });
    key({ key: "ArrowDown", shiftKey: true });
    key({ key: "d", ctrlKey: true });
    expect(cell("2:0").textContent).toBe("Latte");
    // Toggle the On column over rows 0-1.
    key({ key: "Home", ctrlKey: true });
    key({ key: "ArrowRight" });
    key({ key: "ArrowRight" });
    key({ key: "ArrowDown", shiftKey: true });
    key({ key: " " });
    expect(cell("0:2").textContent).toBe("Yes");
    expect(cell("1:2").textContent).toBe("Yes");
    // Clear the Qty range.
    key({ key: "Escape" });
    key({ key: "ArrowLeft" });
    key({ key: "Delete" });
    expect(cell("1:1").textContent).toBe("");
    expect(onChangesChange).toHaveBeenCalled();
    // Undo and redo.
    key({ key: "z", ctrlKey: true });
    expect(cell("1:1").textContent).toBe("2");
    key({ key: "y", ctrlKey: true });
    expect(cell("1:1").textContent).toBe("");
    key({ key: "z", metaKey: true });
    key({ key: "z", metaKey: true, shiftKey: true });
    expect(cell("1:1").textContent).toBe("");
  });

  it("edits with F2 and a double click, commits by Enter, Shift+Enter, Tab and blur, and cancels by Escape", () => {
    render(<DataGrid label="Menu" columns={COLUMNS} items={ROWS} />);
    key({ key: "F2" });
    let input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input.value).toBe("Latte");
    fireEvent.change(input, { target: { value: "Flat white" } });
    fireEvent.keyDown(input, { key: "Tab" });
    expect(cell("0:0").textContent).toBe("Flat white");
    expect(active()).toBe("0:1");
    fireEvent.doubleClick(cell("0:1"));
    input = screen.getByRole("textbox") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "9" } });
    fireEvent.keyDown(input, { key: "Tab", shiftKey: true });
    expect(cell("0:1").textContent).toBe("9");
    expect(active()).toBe("0:0");
    key({ key: "ArrowDown" });
    key({ key: "Enter" });
    input = screen.getByRole("textbox") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Cortado" } });
    fireEvent.keyDown(input, { key: "Enter", shiftKey: true });
    expect(cell("1:0").textContent).toBe("Cortado");
    expect(active()).toBe("0:0");
    key({ key: "x" });
    input = screen.getByRole("textbox") as HTMLInputElement;
    fireEvent.keyDown(input, { key: "Escape" });
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(cell("0:0").textContent).toBe("Flat white");
    key({ key: "q" });
    fireEvent.blur(screen.getByRole("textbox"));
    expect(cell("0:0").textContent).toBe("q");
    // Keys while editing stay with the editor; Alt or a command key starts no edit.
    key({ key: "b", altKey: true });
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("edits a select cell by its choice and a boolean by Enter", () => {
    render(<DataGrid label="Menu" columns={COLUMNS} items={ROWS} />);
    key({ key: "End" });
    key({ key: "Enter" });
    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.value).toBe("s");
    fireEvent.change(select, { target: { value: "l" } });
    expect(cell("0:3").textContent).toBe("Large");
    key({ key: "ArrowLeft" });
    key({ key: "Enter" });
    expect(cell("0:2").textContent).toBe("Yes");
  });

  it("copies and cuts the range as tab-separated text", () => {
    render(<DataGrid label="Menu" columns={COLUMNS} items={ROWS} />);
    key({ key: "ArrowRight", shiftKey: true });
    key({ key: "ArrowDown", shiftKey: true });
    const copy = clipboard();
    fireEvent.copy(gridOf(), { clipboardData: copy.data });
    expect(copy.text()).toBe("Latte\t1\nMocha\t2");
    const cut = clipboard();
    fireEvent.cut(gridOf(), { clipboardData: cut.data });
    expect(cut.text()).toBe("Latte\t1\nMocha\t2");
    expect(cell("0:0").textContent).toBe("");
  });

  it("selects a range by pointer drag and fills it down and across from the handle", () => {
    render(<DataGrid label="Menu" columns={COLUMNS} items={ROWS} />);
    fireEvent.pointerDown(cell("0:1"), { button: 0 });
    over(cell("0:1"));
    fireEvent.pointerMove(gridOf());
    fireEvent.pointerUp(gridOf());
    expect(active()).toBe("0:1");
    // Drag the fill handle from Qty row 0 down to row 2: 1 repeats.
    const handle = () => gridOf().querySelector<HTMLElement>("[data-fill-handle]") as HTMLElement;
    fireEvent.pointerDown(handle());
    over(cell("2:1"));
    fireEvent.pointerMove(gridOf());
    fireEvent.pointerUp(gridOf());
    expect(cell("2:1").textContent).toBe("1");
    // Across: Name row 0 over to Qty.
    fireEvent.pointerDown(cell("0:0"), { button: 0 });
    fireEvent.pointerUp(gridOf());
    fireEvent.pointerDown(handle());
    over(cell("0:1"));
    fireEvent.pointerMove(gridOf());
    over(null);
    fireEvent.pointerMove(gridOf());
    fireEvent.pointerLeave(gridOf());
    // A name copied into a number column is flagged, not dropped.
    expect(cell("0:1").textContent).toBe("Latte");
    expect(cell("0:1").getAttribute("aria-invalid")).toBe("true");
    // A secondary button selects nothing.
    fireEvent.pointerDown(cell("2:2"), { button: 2 });
    expect(active()).toBe("0:0");
    Reflect.deleteProperty(document, "elementFromPoint");
  });

  it("does nothing on keys or the clipboard without rows", () => {
    render(<DataGrid label="Menu" columns={COLUMNS} items={[]} />);
    key({ key: "ArrowDown" });
    fireEvent.paste(gridOf(), { clipboardData: { getData: () => "x" } });
    fireEvent.copy(gridOf(), { clipboardData: clipboard().data });
    expect(gridOf().hasAttribute("aria-activedescendant")).toBe(false);
  });

  it("keeps a read-only grid from editing", () => {
    render(<DataGrid label="Menu" columns={COLUMNS} items={ROWS} isReadOnly />);
    key({ key: "Enter" });
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(gridOf().getAttribute("aria-readonly")).toBe("true");
    act(() => gridOf().focus());
  });
});
