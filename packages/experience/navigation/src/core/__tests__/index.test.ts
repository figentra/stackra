/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: every value the template imports from `@stackra/navigation` (the
 *          kinds, `ChromeConfig` and `ChromeConfig$`, the enums, `data`, `navigation`, `routeRef`, `tabs`) plus the
 *          seams gen and other packages call, and nothing else; the template's types resolve.
 * Boundary: test only; imports the stand-in barrel through its `#core` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as core from "#core/index";
import type {
  InferParams,
  LayoutContext,
  MenuBuilder,
  MetaContext,
  ResolvedMenuItem,
  RouteContext,
  RouteProps,
  RouteRef,
} from "#core/index";

describe("@stackra/navigation", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(core).sort()).toEqual([
      "BackTitle",
      "ChromeConfig",
      "ChromeConfig$",
      "HeaderStyle",
      "Layout",
      "Menu",
      "MenuItemKind",
      "MenuKind",
      "Presentation",
      "RenderMode",
      "Route",
      "contributeRouteContext",
      "data",
      "navigation",
      "registerDocumentResolver",
      "registerRoutes",
      "routeRef",
      "tabs",
    ]);
  });

  it("exports the types the template uses", () => {
    expectTypeOf<RouteRef["name"]>().toEqualTypeOf<string>();
    expectTypeOf<ResolvedMenuItem["label"]>().toEqualTypeOf<string>();
    expectTypeOf<MenuBuilder>().toHaveProperty("route");
    expectTypeOf<RouteContext<core.Route>>().toHaveProperty("redirect");
    expectTypeOf<LayoutContext<core.Layout>>().toHaveProperty("params");
    expectTypeOf<MetaContext<core.Route>>().toHaveProperty("t");
    expectTypeOf<RouteProps<ReturnType<typeof core.Route>>>().toHaveProperty("data");
    expectTypeOf<InferParams<ReturnType<typeof core.Route>>>().toBeObject();
  });
});
