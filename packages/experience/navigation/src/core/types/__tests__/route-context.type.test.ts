/**
 * Stackra file contract:
 * Purpose: type tests of the route types the template leans on: `RouteProps` (data with redirects left out, params from
 *          the path, query from the shape), `InferParams` from a params shape, `PathParams`, `LoaderData` unwrapping a
 *          `RouteResponse`, `MetaContext` with the layout's `site`, `LayoutData` of a layout that only redirects, and
 *          `RouteActionResult` narrowing as the template's submits do.
 * Boundary: test only; compile-time assertions with a trivial runtime body.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 16); ADR 0305 (class components typed by their route).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { Schema } from "@stackra/validation";

import { Layout } from "#core/bases/layout.base";
import { Route } from "#core/bases/route.base";
import type { InferParams } from "#core/types/infer-params.type";
import type { LayoutData } from "#core/types/layout-data.type";
import type { LoaderData } from "#core/types/loader-data.type";
import type { MetaContext } from "#core/types/meta-context.type";
import type { PathParams } from "#core/types/path-params.type";
import type { RouteActionResult } from "#core/types/route-action-result.type";
import type { RouteContext } from "#core/types/route-context.type";
import type { RouteProps } from "#core/types/route-props.type";

class OrdersFilter extends Schema {
  status?: "open" | "paid";
}

class StoreSearch extends Schema {
  q?: string;
}

class SiteLayout extends Layout {
  override async loader(): Promise<{ site: { origin: string } }> {
    return { site: { origin: "https://acme.test" } };
  }
}

class ShellLayout extends Layout({}) {
  override loader(ctx: RouteContext<this>) {
    return ctx.path === "/" ? null : ctx.redirect("/login");
  }
}

class MobileLinkRoute extends Route({ path: "/m/*", layout: ShellLayout }) {
  override loader(ctx: RouteContext<this>) {
    return ctx.params["*"] === "" ? ctx.redirect("/") : { path: ctx.params["*"] };
  }
}

class StoreRoute extends Route({ path: "/store", layout: SiteLayout, search: StoreSearch }) {
  override async loader(ctx: RouteContext<this>) {
    return ctx.data({ origin: ctx.site.origin, q: ctx.search.q }, { status: 200 });
  }
}

class OrdersRoute extends Route({ path: "/orders", params: OrdersFilter }) {}

/** Narrows an action result the way the template's submits do. */
const narrow = (result: RouteActionResult<{ orderId: string }>) => {
  if (!result.ok) return result.error.code;
  if (result.queued) return null;
  return result.data.orderId;
};

describe("route types", () => {
  it("type a page's props by its route", () => {
    expectTypeOf<RouteProps<typeof MobileLinkRoute>["data"]>().toEqualTypeOf<{ path: string }>();
    expectTypeOf<RouteProps<typeof MobileLinkRoute>["params"]>().toEqualTypeOf<{
      readonly "*": string;
    }>();
    expectTypeOf<RouteProps<typeof StoreRoute>["search"]["q"]>().toEqualTypeOf<
      string | undefined
    >();
    expect(true).toBe(true);
  });

  it("infer params, path params and loader data", () => {
    expectTypeOf<InferParams<typeof OrdersRoute>>().toEqualTypeOf<{
      status?: "open" | "paid";
    }>();
    expectTypeOf<PathParams<"/orders/:orderId/lines/:lineId">>().toEqualTypeOf<{
      readonly orderId: string;
      readonly lineId: string;
    }>();
    expectTypeOf<LoaderData<StoreRoute>>().toEqualTypeOf<{
      origin: string;
      q: string | undefined;
    }>();
  });

  it("spread the layout's data into the meta context, and none for a layout that only redirects", () => {
    expectTypeOf<MetaContext<StoreRoute>["site"]>().toEqualTypeOf<{ origin: string }>();
    expectTypeOf<LayoutData<MobileLinkRoute>>().toEqualTypeOf<unknown>();
  });

  it("narrow an action result as the template's submits do", () => {
    expectTypeOf(narrow).returns.toEqualTypeOf<string | null>();
  });
});
