/**
 * Stackra file contract:
 * Purpose: proves the web SortableList reorders from the keyboard: Enter on a row's drag handle lifts it, the arrow
 *          keys move the drop target, and Enter drops it, reporting the new order through `onReorder`.
 * Boundary: jsdom with real React Aria drag and drop (its keyboard path); no pointer drag.
 * Runtime: browser
 * Governing contract: ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";

import { SortableList } from "#react/sortable-list/sortable-list";

const ITEMS = [
  { id: "hot", label: "Hot drinks" },
  { id: "cold", label: "Cold drinks" },
  { id: "pastry", label: "Pastries" },
];

/** Lifts the row by its handle with Enter, moves the drop target with ArrowDown, then drops with Enter. */
function keyboardDrag(handle: HTMLElement, steps: number): void {
  act(() => handle.focus());
  fireEvent.keyDown(handle, { key: "Enter" });
  fireEvent.keyUp(handle, { key: "Enter" });
  act(() => vi.runAllTimers());
  for (let step = 0; step < steps; step += 1) {
    fireEvent.keyDown(document.activeElement ?? document.body, { key: "ArrowDown" });
    fireEvent.keyUp(document.activeElement ?? document.body, { key: "ArrowDown" });
  }
  fireEvent.keyDown(document.activeElement ?? document.body, { key: "Enter" });
  fireEvent.keyUp(document.activeElement ?? document.body, { key: "Enter" });
  act(() => vi.runAllTimers());
}

describe("SortableList keyboard reorder (web)", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("moves a row down with the keyboard and reports the new order", () => {
    const onReorder = vi.fn();
    render(<SortableList items={ITEMS} onReorder={onReorder} label="Menu" />);
    keyboardDrag(screen.getByRole("button", { name: "Reorder Hot drinks" }), 2);
    expect(onReorder.mock.lastCall?.[0].map((item: { id: string }) => item.id)).toEqual([
      "cold",
      "pastry",
      "hot",
    ]);
  });
});
