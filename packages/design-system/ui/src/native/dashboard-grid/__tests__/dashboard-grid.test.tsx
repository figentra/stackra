/**
 * Stackra file contract:
 * Purpose: proves the native DashboardGrid draws its tiles in layout order, and in edit mode hands them by name to a
 *          `SortableList` whose reorder comes back as a layout with each tile's size kept.
 * Boundary: jsdom with React Native and the native SortableList replaced by stand-ins; the list's own drag and
 *           accessibility actions are proved in its test.
 * Runtime: react-native
 * Governing contract: ADR 0022 (test placement); ADR 0307 (decision 18); STA-1371.
 */
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import type { DashboardLayout } from "#contracts/types/dashboard-layout.type";
import { DashboardGrid } from "#native/dashboard-grid/dashboard-grid";

const state = vi.hoisted(() => ({ list: {} as Record<string, unknown> }));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: Record<string, unknown>) =>
      createElement(
        "div",
        { "aria-label": props["accessibilityLabel"] as string | undefined },
        props["children"] as ReactNode,
      ),
  };
});

vi.mock("#native/sortable-list/sortable-list", () => ({
  SortableList: (props: Record<string, unknown>) => {
    state.list = props;
    return null;
  },
}));

const LAYOUT: DashboardLayout = [
  { id: "revenue", size: "small" },
  { id: "orders", size: "full" },
];
const tileLabel = (id: string) => (id === "revenue" ? "Revenue" : "Orders");

describe("DashboardGrid (native)", () => {
  it("draws the tiles in layout order", () => {
    render(
      <DashboardGrid
        label="Sales"
        defaultLayout={LAYOUT}
        tileLabel={tileLabel}
        renderTile={(id) => <span>{`${tileLabel(id)} tile`}</span>}
      />,
    );
    expect(screen.getByLabelText("Sales").textContent).toBe("Revenue tileOrders tile");
  });

  it("reorders by name in edit mode and keeps each tile's size", () => {
    const onLayoutChange = vi.fn();
    render(
      <DashboardGrid
        label="Sales"
        defaultLayout={LAYOUT}
        tileLabel={tileLabel}
        renderTile={() => null}
        onLayoutChange={onLayoutChange}
        isEditing
      />,
    );
    const items = state.list["items"] as { id: string; label: string; size: string }[];
    expect(items.map((item) => item.label)).toEqual(["Revenue", "Orders"]);
    (state.list["onReorder"] as (rows: typeof items) => void)([items[1], items[0]] as typeof items);
    expect(onLayoutChange).toHaveBeenLastCalledWith([
      { id: "orders", size: "full" },
      { id: "revenue", size: "small" },
    ]);
  });
});
