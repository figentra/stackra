/**
 * Stackra file contract:
 * Purpose: unit and type tests of `routeRef`: a frozen ref named by the route key, typed by the route class, and a key
 *          that is not snake_case refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 20).
 */
import { describe, expect, expectTypeOf, it } from "vitest";

import { Route } from "#core/bases/route.base";
import { routeRef } from "#core/functions/route-ref.function";
import type { RouteRef } from "#core/types/route-ref.type";

class QuickOrderRoute extends Route({ path: "/quick-order" }) {}

describe("routeRef", () => {
  it("names the route by its key", () => {
    const ref = routeRef<typeof QuickOrderRoute>("quick_order");
    expect(ref).toEqual({ name: "quick_order" });
    expect(Object.isFrozen(ref)).toBe(true);
    expectTypeOf(ref).toEqualTypeOf<RouteRef<typeof QuickOrderRoute>>();
    const anyRoute: RouteRef = ref;
    expect(anyRoute.name).toBe("quick_order");
  });

  it("refuses a key that is not snake_case", () => {
    expect(() => routeRef("quick-order")).toThrow(RangeError);
    expect(() => routeRef("QuickOrder")).toThrow(RangeError);
  });
});
