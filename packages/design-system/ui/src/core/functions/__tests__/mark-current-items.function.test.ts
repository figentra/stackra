/**
 * Stackra file contract:
 * Purpose: proves `markCurrentItems` for an exact match, a whole-segment prefix, a near-miss that shares letters, the
 *          longest match winning, the root matching only itself, a nested entry, a query and a trailing slash, an
 *          absolute URL, and a tree that is left unchanged.
 * Boundary: pure function, no DOM.
 * Runtime: node
 * Governing contract: ADR 0317 (decision 3); ADR 0022 (test placement).
 */
// @covers sta-350:FR-155
import type { NavigationItem } from "#contracts/types/navigation-item.type";
import { markCurrentItems } from "#core/functions/mark-current-items.function";

const items: readonly NavigationItem[] = [
  { id: "home", label: "Home", href: "/" },
  { id: "orders", label: "Orders", href: "/orders" },
  {
    id: "catalogue",
    label: "Catalogue",
    children: [
      { id: "products", label: "Products", href: "/products" },
      { id: "new", label: "New product", href: "/products/new" },
    ],
  },
  { id: "docs", label: "Docs", href: "https://example.com/orders" },
];

/** The ids flagged current anywhere in the tree. */
function flagged(tree: readonly NavigationItem[]): string[] {
  return tree.flatMap((item) => [
    ...(item.isCurrent === true ? [item.id] : []),
    ...flagged(item.children ?? []),
  ]);
}

describe("markCurrentItems", () => {
  it("flags the entry whose href is the path", () => {
    expect(flagged(markCurrentItems(items, "/orders"))).toEqual(["orders"]);
  });

  it("flags an entry on a path below its href, at a whole segment", () => {
    expect(flagged(markCurrentItems(items, "/orders/ord_1"))).toEqual(["orders"]);
  });

  it("does not flag an entry whose href only shares letters with the path", () => {
    expect(flagged(markCurrentItems(items, "/orders-archive"))).toEqual([]);
  });

  it("prefers the longest match, through nested entries", () => {
    expect(flagged(markCurrentItems(items, "/products/new"))).toEqual(["new"]);
    expect(flagged(markCurrentItems(items, "/products/p_1"))).toEqual(["products"]);
  });

  it("flags the root only on the root", () => {
    expect(flagged(markCurrentItems(items, "/"))).toEqual(["home"]);
    expect(flagged(markCurrentItems(items, "/nowhere"))).toEqual([]);
  });

  it("ignores a query, a fragment and a trailing slash on either side", () => {
    expect(flagged(markCurrentItems(items, "/orders/?page=2#top"))).toEqual(["orders"]);
    const withQuery: readonly NavigationItem[] = [{ id: "o", label: "O", href: "/orders/?a=1" }];
    expect(flagged(markCurrentItems(withQuery, "/orders"))).toEqual(["o"]);
  });

  it("never flags an absolute URL", () => {
    const absolute: readonly NavigationItem[] = [
      { id: "d", label: "D", href: "https://example.com/" },
    ];
    expect(flagged(markCurrentItems(absolute, "/"))).toEqual([]);
  });

  it("clears a flag the app set and leaves the given tree unchanged", () => {
    const given: readonly NavigationItem[] = [
      { id: "o", label: "O", href: "/orders", isCurrent: true },
    ];
    expect(flagged(markCurrentItems(given, "/elsewhere"))).toEqual([]);
    expect(given[0]?.isCurrent).toBe(true);
  });
});
