/**
 * Stackra file contract:
 * Purpose: proves more of the web DashboardGrid's edit mode: a controlled `layout` only reports a change and draws
 *          what the app passes back; the size button wraps from Full width to Small; focus stays on a pressed move control as
 *          its tile moves, and reaches the drag handle when that control turns off; the edge drag
 *          ignores a secondary button, changes nothing when it ends on the same size, and runs the other way in
 *          right-to-left.
 * Boundary: jsdom with real React Aria; the grid's width and direction are stand-ins because jsdom has no layout. A
 *           pointer drag-and-drop reorder needs a real browser and is left to `reorder-items.function.test.ts`.
 * Runtime: browser
 * Governing contract: ADR 0307 (decision 18); WCAG 2.2 SC 2.4.3 and 2.5.7; ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";

import type { DashboardLayout } from "#contracts/types/dashboard-layout.type";
import { DashboardGrid } from "#react/dashboard-grid/dashboard-grid";

const LAYOUT: DashboardLayout = [
  { id: "revenue", size: "small" },
  { id: "orders", size: "full" },
];
const NAMES: Record<string, string> = { revenue: "Revenue", orders: "Orders" };
const tileLabel = (id: string) => NAMES[id] ?? id;
const renderTile = (id: string) => <p>{`${tileLabel(id)} tile`}</p>;

/** The edge handle of a tile, on a grid 1200px wide in the given direction. */
function handleOf(id: string, direction: "ltr" | "rtl" = "ltr") {
  const grid = screen.getByRole("grid", { name: "Sales" });
  grid.getBoundingClientRect = () => ({ width: 1200 }) as DOMRect;
  grid.style.direction = direction;
  const handle = grid.querySelector<HTMLElement>(`[data-tile-id="${id}"] [data-action="resize"]`);
  if (!handle) throw new Error("no handle");
  handle.setPointerCapture = () => undefined;
  return handle;
}

/** Drags a handle from one x to another and lets go. */
function drag(handle: HTMLElement, from: number, to: number, button = 0) {
  fireEvent.pointerDown(handle, { button, clientX: from, pointerId: 1 });
  fireEvent.pointerMove(handle, { clientX: to, pointerId: 1 });
  fireEvent.pointerUp(handle, { clientX: to, pointerId: 1 });
}

describe("DashboardGrid edit mode (web)", () => {
  beforeEach(() => {
    // jsdom has no PointerEvent, so a pointer event would lose its coordinates; a MouseEvent carries them.
    vi.stubGlobal("PointerEvent", window.PointerEvent ?? MouseEvent);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("only reports a change under a controlled layout", () => {
    const onLayoutChange = vi.fn();
    const { rerender } = render(
      <DashboardGrid
        label="Sales"
        layout={LAYOUT}
        renderTile={renderTile}
        tileLabel={tileLabel}
        onLayoutChange={onLayoutChange}
        isEditing
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Move Revenue later" }));
    expect(onLayoutChange).toHaveBeenLastCalledWith([LAYOUT[1], LAYOUT[0]]);
    expect(screen.getByRole("button", { name: "Move Revenue later" })).toBeTruthy();
    rerender(
      <DashboardGrid
        label="Sales"
        layout={[LAYOUT[1], LAYOUT[0]].flatMap((tile) => (tile ? [tile] : []))}
        renderTile={renderTile}
        tileLabel={tileLabel}
        onLayoutChange={onLayoutChange}
        isEditing
      />,
    );
    expect(
      (screen.getByRole("button", { name: "Move Revenue later" }) as HTMLButtonElement).disabled,
    ).toBe(true);
  });

  it("wraps the size from Full width back to Small", () => {
    const onLayoutChange = vi.fn();
    render(
      <DashboardGrid
        label="Sales"
        defaultLayout={LAYOUT}
        renderTile={renderTile}
        tileLabel={tileLabel}
        onLayoutChange={onLayoutChange}
        isEditing
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Change the size of Orders, now Full width" }),
    );
    expect(onLayoutChange).toHaveBeenLastCalledWith([LAYOUT[0], { id: "orders", size: "small" }]);
    expect(screen.getByText("Orders is now Small")).toBeTruthy();
  });

  it("keeps focus on the pressed control as its tile moves", () => {
    render(
      <DashboardGrid
        label="Sales"
        defaultLayout={[...LAYOUT, { id: "stock", size: "small" }]}
        renderTile={renderTile}
        tileLabel={tileLabel}
        isEditing
      />,
    );
    const later = screen.getByRole("button", { name: "Move Revenue later" });
    act(() => later.focus());
    fireEvent.keyDown(later, { key: "Enter" });
    fireEvent.keyUp(later, { key: "Enter" });
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Move Revenue later" }));
  });

  // The control's off state is decided from the new index, not read from the DOM, which React Aria may not have
  // redrawn yet when the refocus effect runs (STA-1371).
  it("focuses the moved tile's drag handle when the pressed control is now off", async () => {
    render(
      <DashboardGrid
        label="Sales"
        defaultLayout={LAYOUT}
        renderTile={renderTile}
        tileLabel={tileLabel}
        isEditing
      />,
    );
    const earlier = screen.getByRole("button", { name: "Move Orders earlier" });
    act(() => earlier.focus());
    fireEvent.keyDown(earlier, { key: "Enter" });
    fireEvent.keyUp(earlier, { key: "Enter" });
    await act(async () => {
      await new Promise((done) => {
        setTimeout(done, 20);
      });
    });
    // Orders is first now, so its "earlier" is off and focus should go to its drag handle.
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Drag Orders" }));
  });

  it("ignores a secondary button and changes nothing when the drag ends on the same size", () => {
    const onLayoutChange = vi.fn();
    render(
      <DashboardGrid
        label="Sales"
        defaultLayout={LAYOUT}
        renderTile={renderTile}
        tileLabel={tileLabel}
        onLayoutChange={onLayoutChange}
        isEditing
      />,
    );
    drag(handleOf("revenue"), 300, 900, 2);
    expect(onLayoutChange).not.toHaveBeenCalled();
    // 50px is half a column: still Small.
    drag(handleOf("revenue"), 300, 350);
    expect(onLayoutChange).not.toHaveBeenCalled();
    // A release with no drag before it changes nothing either.
    fireEvent.pointerUp(handleOf("revenue"), { clientX: 0, pointerId: 1 });
    expect(onLayoutChange).not.toHaveBeenCalled();
  });

  it("grows a tile by dragging leftwards in right-to-left", () => {
    const onLayoutChange = vi.fn();
    render(
      <DashboardGrid
        label="Sales"
        defaultLayout={LAYOUT}
        renderTile={renderTile}
        tileLabel={tileLabel}
        onLayoutChange={onLayoutChange}
        isEditing
      />,
    );
    drag(handleOf("revenue", "rtl"), 900, 300);
    expect(onLayoutChange).toHaveBeenLastCalledWith([{ id: "revenue", size: "large" }, LAYOUT[1]]);
  });
});
