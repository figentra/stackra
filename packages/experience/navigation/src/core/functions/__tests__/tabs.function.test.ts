/**
 * Stackra file contract:
 * Purpose: unit tests of `tabs`: sorted by order and frozen; a bad or shared order and a repeated route are refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0295 (decision 12).
 */
import { describe, expect, it } from "@stackra/testing";

import { routeRef } from "#core/functions/route-ref.function";
import { tabs } from "#core/functions/tabs.function";

const Routes = {
  dashboard: routeRef("dashboard"),
  quick_order: routeRef("quick_order"),
  settings: routeRef("settings"),
};

describe("tabs", () => {
  it("sorts by order", () => {
    const list = tabs([
      { route: Routes.settings, order: 3, icon: "settings", label: "pages::settings.title" },
      { route: Routes.dashboard, order: 1, icon: "house", label: "pages::dashboard.title" },
      { route: Routes.quick_order, order: 2, icon: "zap", label: "orders::quick_order.title" },
    ]);
    expect(list.map((tab) => tab.route.name)).toEqual(["dashboard", "quick_order", "settings"]);
    expect(Object.isFrozen(list)).toBe(true);
  });

  it("refuses a bad or shared order and a route listed twice", () => {
    const tab = { route: Routes.dashboard, order: 1, icon: "house", label: "l" } as const;
    expect(() => tabs([{ ...tab, order: 0 }])).toThrow(RangeError);
    expect(() => tabs([tab, { ...tab, route: Routes.settings }])).toThrow(/share an order/);
    expect(() => tabs([tab, { ...tab, order: 2 }])).toThrow(/once/);
  });
});
