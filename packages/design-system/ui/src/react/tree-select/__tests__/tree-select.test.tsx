/**
 * Stackra file contract:
 * Purpose: proves the web TreeSelect's trigger is named by its label and value, opens a tree, closes on a single
 *          choice and shows its name, and in multiple mode ticks a parent's rows and shows "3 chosen".
 * Boundary: jsdom with real HeroUI and React Aria; English words from the catalogue.
 * Runtime: browser
 * Governing contract: ADR 0022 (test placement); STA-1371 (wave C).
 */
// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";

import type { TreeViewNode } from "#contracts/types/tree-view-node.type";
import { TreeSelect } from "#react/tree-select/tree-select";

const CATEGORIES: readonly TreeViewNode[] = [
  {
    id: "women",
    label: "Women",
    children: [
      { id: "abayas", label: "Abayas" },
      { id: "dresses", label: "Dresses" },
    ],
  },
  { id: "men", label: "Men" },
];

describe("TreeSelect (web)", () => {
  it("opens a tree from a trigger named by the label and closes on a single choice", () => {
    const onChange = vi.fn();
    render(<TreeSelect label="Category" items={CATEGORIES} onChange={onChange} />);
    const trigger = screen.getByRole("button", { name: "Category Choose" });
    act(() => trigger.click());
    act(() => screen.getByText("Men").click());
    expect(onChange).toHaveBeenLastCalledWith(["men"]);
    expect(screen.queryByRole("treegrid")).toBeNull();
    expect(screen.getByRole("button", { name: "Category Men" })).toBeTruthy();
  });

  it("ticks a parent's rows in multiple mode and counts them", () => {
    const onChange = vi.fn();
    render(
      <TreeSelect
        label="Categories"
        items={CATEGORIES}
        selectionMode="multiple"
        defaultExpandedKeys={["women"]}
        onChange={onChange}
      />,
    );
    act(() => screen.getByRole("button", { name: "Categories Choose" }).click());
    act(() => screen.getByText("Women").click());
    expect(onChange).toHaveBeenLastCalledWith(["women", "abayas", "dresses"]);
    expect(screen.getByRole("treegrid")).toBeTruthy();
    expect(screen.getByText("3 chosen")).toBeTruthy();
  });
});
