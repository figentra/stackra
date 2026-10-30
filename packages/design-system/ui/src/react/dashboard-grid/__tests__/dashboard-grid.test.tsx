/**
 * Stackra file contract:
 * Purpose: proves the web DashboardGrid draws each tile in its span, shows no controls outside edit mode, moves a tile
 *          earlier or later and steps its size from the keyboard-reachable buttons with a spoken announcement, and
 *          loads and saves its layout through a `DashboardLayoutPort`.
 * Boundary: jsdom with real React Aria; a pointer drag cannot run in jsdom, so the drop's arithmetic is proved in
 *           `reorder-items.function.test.ts`.
 * Runtime: browser
 * Governing contract: ADR 0022 (test placement); ADR 0307 (decision 18); STA-1371.
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";

import type { DashboardLayout } from "#contracts/types/dashboard-layout.type";
import { DashboardGrid } from "#react/dashboard-grid/dashboard-grid";

const LAYOUT: DashboardLayout = [
  { id: "revenue", size: "small" },
  { id: "orders", size: "medium" },
];
const NAMES: Record<string, string> = { revenue: "Revenue", orders: "Orders" };
const tileLabel = (id: string) => NAMES[id] ?? id;
const renderTile = (id: string) => <p>{`${tileLabel(id)} tile`}</p>;

describe("DashboardGrid (web)", () => {
  it("draws the tiles in their spans, with no controls outside edit mode", () => {
    render(
      <DashboardGrid
        label="Sales"
        defaultLayout={LAYOUT}
        renderTile={renderTile}
        tileLabel={tileLabel}
      />,
    );
    const grid = screen.getByRole("group", { name: "Sales" });
    expect(grid.className).toContain("grid-cols-12");
    expect(screen.getByText("Revenue tile").parentElement?.className).toContain("@3xl:col-span-3");
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("moves and resizes a tile from its buttons and announces each change", () => {
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
    expect(screen.getByRole("grid", { name: "Sales" })).toBeTruthy();
    expect(
      (screen.getByRole("button", { name: "Move Revenue earlier" }) as HTMLButtonElement).disabled,
    ).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Move Revenue later" }));
    expect(onLayoutChange).toHaveBeenLastCalledWith([LAYOUT[1], LAYOUT[0]]);
    expect(screen.getByText("Revenue moved to position 2 of 2")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Change the size of Orders, now Medium" }));
    expect(onLayoutChange).toHaveBeenLastCalledWith([
      { id: "orders", size: "large" },
      { id: "revenue", size: "small" },
    ]);
    expect(screen.getByText("Orders is now Large")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Drag Orders" })).toBeTruthy();
  });

  it("adds no title of its own in edit mode and resizes by dragging the inline-end edge", () => {
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
    // The tile's name appears only in the tile itself and in its controls' names.
    expect(screen.queryByText("Revenue")).toBeNull();
    const grid = screen.getByRole("grid", { name: "Sales" });
    grid.getBoundingClientRect = () => ({ width: 1200 }) as DOMRect;
    const handle = grid.querySelector<HTMLElement>(
      '[data-tile-id="revenue"] [data-action="resize"]',
    );
    expect(handle?.getAttribute("aria-hidden")).toBe("true");
    if (!handle) return;
    handle.setPointerCapture = () => undefined;
    // jsdom has no PointerEvent, so a pointer event would lose its coordinates; a MouseEvent carries them.
    vi.stubGlobal("PointerEvent", window.PointerEvent ?? MouseEvent);
    // Small spans 3 columns of 100px; 320px more is 6.2 columns, which snaps to Medium.
    fireEvent.pointerDown(handle, { button: 0, clientX: 300, pointerId: 1 });
    fireEvent.pointerMove(handle, { clientX: 620, pointerId: 1 });
    fireEvent.pointerUp(handle, { clientX: 620, pointerId: 1 });
    expect(onLayoutChange).toHaveBeenLastCalledWith([
      { id: "revenue", size: "medium" },
      { id: "orders", size: "medium" },
    ]);
    expect(screen.getByText("Revenue is now Medium")).toBeTruthy();
  });

  it("loads the saved layout through the port and saves each change", async () => {
    const save = vi.fn(async () => undefined);
    const port = { load: async () => [{ id: "orders", size: "full" as const }], save };
    render(
      <DashboardGrid
        label="Sales"
        defaultLayout={LAYOUT}
        layoutPort={port}
        renderTile={renderTile}
        tileLabel={tileLabel}
        isEditing
      />,
    );
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Change the size of Orders, now Full width" }),
      ).toBeTruthy(),
    );
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Move Orders later" }));
    });
    expect(save).toHaveBeenLastCalledWith([
      { id: "revenue", size: "small" },
      { id: "orders", size: "full" },
    ]);
  });
});
