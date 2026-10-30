/**
 * Stackra file contract:
 * Purpose: proves `filterNavigationItems` keeps matches with their whole subtree, keeps a parent only for its matching
 *          children, ignores case and returns the tree unchanged for an empty filter.
 * Boundary: pure function; no rendering.
 * Runtime: node
 * Governing contract: ADR 0022 (test placement); owner request 2026-10-29 (STA-1371).
 */
import type { NavigationItem } from "#contracts/types/navigation-item.type";
import { filterNavigationItems } from "#core/functions/filter-navigation-items.function";

const TREE: readonly NavigationItem[] = [
  { id: "home", label: "Home", href: "/" },
  {
    id: "settings",
    label: "Settings",
    children: [
      { id: "profile", label: "Profile", href: "/profile" },
      { id: "billing", label: "Billing", href: "/billing" },
    ],
  },
];

describe("filterNavigationItems", () => {
  it("returns the tree unchanged for an empty filter", () => {
    expect(filterNavigationItems(TREE, "  ")).toBe(TREE);
  });

  it("keeps a parent only for its matching children, ignoring case", () => {
    expect(filterNavigationItems(TREE, "BILL")).toEqual([
      { ...TREE[1], children: [TREE[1]?.children?.[1]] },
    ]);
  });

  it("keeps a matching parent with all of its children", () => {
    expect(filterNavigationItems(TREE, "sett")).toEqual([TREE[1]]);
  });

  it("returns nothing when nothing matches", () => {
    expect(filterNavigationItems(TREE, "zzz")).toEqual([]);
  });
});
