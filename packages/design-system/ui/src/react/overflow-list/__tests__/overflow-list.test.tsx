/**
 * Stackra file contract:
 * Purpose: proves the web OverflowList is a list named by its label, shows `maxVisible` chips and folds the rest into
 *          one "+N more" button that expands the row and folds it again, and draws no button when nothing is folded.
 * Boundary: jsdom with real HeroUI and React Aria; motion runs without layout, so heights are not checked.
 * Runtime: browser
 * Governing contract: ADR 0022 (test placement); design-system gap inventory (2026-10-28) row 24.
 */
// @vitest-environment jsdom
import { act, render, screen, within } from "@testing-library/react";

import { OverflowList } from "#react/overflow-list/overflow-list";

const TAGS = ["Vegan", "Spicy", "Gluten free", "Halal", "New"].map((label) => ({
  id: label.toLowerCase(),
  label,
}));

describe("OverflowList (web)", () => {
  it("shows maxVisible chips and folds the rest into +N more, which expands and folds again", () => {
    render(<OverflowList items={TAGS} maxVisible={2} label="Dish tags" />);
    const list = screen.getByRole("list", { name: "Dish tags" });
    expect(within(list).getByText("Vegan")).toBeTruthy();
    expect(within(list).queryByText("Halal")).toBeNull();
    const more = screen.getByRole("button", { name: "+3 more" });
    expect(more.getAttribute("aria-expanded")).toBe("false");
    act(() => more.click());
    expect(within(list).getByText("Halal")).toBeTruthy();
    const less = screen.getByRole("button", { name: "Show less" });
    expect(less.getAttribute("aria-expanded")).toBe("true");
    act(() => less.click());
    expect(within(list).queryByText("Halal")).toBeNull();
  });

  it("draws no button when nothing is folded, and starts expanded on request", () => {
    const { unmount } = render(<OverflowList items={TAGS.slice(0, 2)} label="Dish tags" />);
    expect(screen.queryByRole("button")).toBeNull();
    unmount();
    render(<OverflowList items={TAGS} maxVisible={1} label="Dish tags" defaultExpanded />);
    expect(screen.getByText("New")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Show less" })).toBeTruthy();
  });
});
