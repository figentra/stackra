/**
 * Stackra file contract:
 * Purpose: unit tests of `navigation`: the console's generated tree is kept in order and frozen, and an empty group or
 *          entry label is refused.
 * Boundary: test only; the panel and targets are local stand-ins.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0214; ADR 0164.
 */
import { describe, expect, it } from "vitest";

import { navigation } from "#core/functions/navigation.function";
import { routeRef } from "#core/functions/route-ref.function";

class ScopeAdminPanel {}

const Product = { base: "/catalogue/products" };

describe("navigation", () => {
  it("keeps the groups and entries in order, frozen", () => {
    const tree = navigation(ScopeAdminPanel, [
      {
        group: "catalogue::nav.catalogue",
        items: [{ label: "catalogue::resources.product.title", to: Product, icon: "package" }],
      },
      {
        group: "pages::settings.title",
        items: [{ label: "orders::settings.title", to: routeRef("settings") }],
      },
    ]);
    expect(tree.panel).toBe(ScopeAdminPanel);
    expect(tree.groups.map((group) => group.group)).toEqual([
      "catalogue::nav.catalogue",
      "pages::settings.title",
    ]);
    expect(tree.groups[0]?.items[0]).toEqual({
      label: "catalogue::resources.product.title",
      to: Product,
      icon: "package",
    });
    expect(Object.isFrozen(tree.groups[0]?.items)).toBe(true);
  });

  it("refuses an empty label", () => {
    expect(() => navigation(ScopeAdminPanel, [{ group: "", items: [] }])).toThrow(RangeError);
    expect(() =>
      navigation(ScopeAdminPanel, [{ group: "g::a", items: [{ label: "", to: "/x" }] }]),
    ).toThrow(/needs a label/);
  });
});
