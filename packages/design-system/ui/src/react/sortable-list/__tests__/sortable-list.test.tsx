/**
 * Stackra file contract:
 * Purpose: proves the web SortableList is a grid named by its label with one row per item, gives each row a drag
 *          handle named after it, draws a custom row through `renderItem`, and draws no handles when disabled.
 * Boundary: jsdom with real React Aria; a drag cannot run in jsdom, so the drop's arithmetic is proved in
 *           `reorder-items.function.test.ts`.
 * Runtime: browser
 * Governing contract: ADR 0022 (test placement); design-system gap inventory (2026-10-28) row 10.
 */
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";

import { SortableList } from "#react/sortable-list/sortable-list";

const CATEGORIES = [
  { id: "hot", label: "Hot drinks", description: "12 items" },
  { id: "cold", label: "Cold drinks" },
  { id: "pastry", label: "Pastries" },
];

describe("SortableList (web)", () => {
  it("is a grid named by its label whose rows each have a named drag handle", () => {
    render(<SortableList items={CATEGORIES} onReorder={vi.fn()} label="Menu categories" />);
    expect(screen.getByRole("grid", { name: "Menu categories" })).toBeTruthy();
    expect(screen.getAllByRole("row")).toHaveLength(3);
    expect(screen.getByRole("button", { name: "Reorder Hot drinks" })).toBeTruthy();
    expect(screen.getByText("12 items")).toBeTruthy();
  });

  it("draws a custom row and no handles when disabled", () => {
    render(
      <SortableList
        items={CATEGORIES}
        onReorder={vi.fn()}
        label="Menu categories"
        isDisabled
        renderItem={(item) => <b>{item.label.toUpperCase()}</b>}
      />,
    );
    expect(screen.getByText("PASTRIES")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Reorder/ })).toBeNull();
  });
});
