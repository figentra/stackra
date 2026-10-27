/**
 * Stackra file contract:
 * Purpose: proves the web FloorPlanEditor names each item with its seats, selects on focus, and proposes changes from
 *          the keyboard (arrows move a cell, Shift resizes) and from a pointer drag on release; a fixed item and a key
 *          that does nothing propose nothing.
 * Boundary: jsdom; the English catalogue answers the seat words.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); WCAG 2.2 SC 2.1.1 and 2.5.7; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";

import { FloorPlanEditor } from "#react/floor-plan-editor/floor-plan-editor";

const items = [
  { id: "t1", shape: "rectangle" as const, label: "T1", x: 2, y: 2, width: 2, height: 2, seats: 4 },
  {
    id: "bar",
    shape: "label" as const,
    label: "Bar",
    x: 0,
    y: 0,
    width: 3,
    height: 1,
    isMovable: false,
  },
];
const props = {
  label: "Main hall",
  columns: 10,
  rows: 8,
  cellSize: 20,
  items,
  keyboardHint: "Arrows move",
};
const table = () => screen.getByRole("button", { name: "T1, Seats: 4" });

describe("FloorPlanEditor (web)", () => {
  it("names the plan and its items and selects on focus", () => {
    const onSelectionChange = vi.fn();
    render(<FloorPlanEditor {...props} selectedId="t1" onSelectionChange={onSelectionChange} />);
    expect(screen.getByRole("group", { name: "Main hall" })).toBeTruthy();
    expect(table().getAttribute("aria-pressed")).toBe("true");
    fireEvent.focus(screen.getByRole("button", { name: "Bar" }));
    expect(onSelectionChange).toHaveBeenCalledWith("bar");
  });

  it("moves and resizes from the keyboard", () => {
    const onItemChange = vi.fn();
    render(<FloorPlanEditor {...props} onItemChange={onItemChange} />);
    fireEvent.keyDown(table(), { key: "ArrowRight" });
    expect(onItemChange).toHaveBeenLastCalledWith(expect.objectContaining({ x: 3, y: 2 }));
    fireEvent.keyDown(table(), { key: "ArrowDown", shiftKey: true });
    expect(onItemChange).toHaveBeenLastCalledWith(expect.objectContaining({ width: 2, height: 3 }));
  });

  it("proposes nothing for a fixed item or a key that does nothing", () => {
    const onItemChange = vi.fn();
    render(<FloorPlanEditor {...props} onItemChange={onItemChange} />);
    fireEvent.keyDown(screen.getByRole("button", { name: "Bar" }), { key: "ArrowDown" });
    fireEvent.keyDown(table(), { key: "Enter" });
    fireEvent.keyDown(table(), { key: "ArrowUp" });
    expect(onItemChange).toHaveBeenCalledOnce();
    expect(onItemChange).toHaveBeenLastCalledWith(expect.objectContaining({ y: 1, height: 2 }));
  });

  it("proposes the dragged item on release", () => {
    const onItemChange = vi.fn();
    render(<FloorPlanEditor {...props} onItemChange={onItemChange} />);
    fireEvent.pointerDown(table(), { clientX: 0, clientY: 0, pointerId: 1 });
    fireEvent.pointerMove(table(), { clientX: 41, clientY: 19, pointerId: 1 });
    fireEvent.pointerUp(table(), { clientX: 41, clientY: 19, pointerId: 1 });
    expect(onItemChange).toHaveBeenCalledWith(expect.objectContaining({ x: 4, y: 3 }));
  });
});
