/**
 * Stackra file contract:
 * Purpose: unit and type tests of the `Route` kind base: the template's routes record their options with the defaults
 *          filled in, a bad path, tab order or status is refused where the class is declared, the base members answer
 *          nothing, constructor injection reaches the loader, and `RouteContext<this>` types params, query and the
 *          layout's data.
 * Boundary: test only; the classes restate the template's console, web and mobile routes with local stand-ins.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decisions 14, 16 and 25).
 */
import { kindOf } from "@stackra/container";
import { describe, expect, expectTypeOf, it } from "vitest";

import { Layout } from "#core/bases/layout.base";
import { Route } from "#core/bases/route.base";
import { HeaderStyle } from "#core/enums/header-style.enum";
import { Presentation } from "#core/enums/presentation.enum";
import type { RouteClass } from "#core/types/route-class.type";
import type { RouteContext } from "#core/types/route-context.type";

class SiteLayout extends Layout {
  override async loader(): Promise<{ site: { name: string; origin: string } }> {
    return { site: { name: "Acme", origin: "https://acme.test" } };
  }
}

class ProductRoute extends Route({
  path: "/store/:slug",
  layout: SiteLayout,
}) {
  override async loader(ctx: RouteContext<this>) {
    return { slug: ctx.params.slug, site: ctx.site.name };
  }
}

/** A stand-in for an injected config. */
class SiteConfig {
  readonly product = "acme";
}

class PricingRoute extends Route({
  path: "/pricing",
  seo: { title: "web::pricing.title" },
}) {
  private readonly site: SiteConfig;

  constructor(site: SiteConfig) {
    super();
    this.site = site;
  }

  override loader() {
    return { product: this.site.product };
  }
}

describe("Route", () => {
  it("records the options with the defaults filled in", () => {
    class HomeRoute extends Route({
      path: "/",
      tab: { order: 1, icon: "house" },
      chrome: { header: HeaderStyle.Large },
    }) {}
    expect(kindOf(HomeRoute)).toEqual({
      kind: "route",
      options: {
        path: "/",
        layout: null,
        title: null,
        tab: { order: 1, icon: "house" },
        auth: true,
        permission: null,
        flag: null,
        capability: {},
        status: null,
        params: null,
        search: null,
        seo: null,
        render: null,
        prerender: false,
        presentation: Presentation.Push,
        chrome: { header: "large" },
        document: null,
        cache: null,
      },
    });
  });

  it("records a route with no path (a signed-out screen)", () => {
    class SignInRoute extends Route({
      auth: false,
      chrome: { header: HeaderStyle.Hidden },
    }) {}
    expect(kindOf(SignInRoute)?.options).toMatchObject({ path: null, auth: false });
  });

  it("refuses a bad path, tab order or status where it is declared", () => {
    expect(() => Route({ path: "settings" })).toThrow(RangeError);
    expect(() => Route({ path: "/", tab: { order: 0, icon: "house" } })).toThrow(/tab order/);
    expect(() => Route({ path: "*", status: 700 })).toThrow(/HTTP status/);
  });

  it("answers no data, nothing and an empty head by default", async () => {
    class OpenRoute extends Route({ path: "/open" }) {}
    const route = new OpenRoute();
    expect(await route.loader({} as never)).toBeNull();
    expect(await route.submit({} as never)).toBeNull();
    expect(route.meta({} as never)).toEqual({});
  });

  it("injects through the constructor", () => {
    expect(new PricingRoute(new SiteConfig()).loader()).toEqual({ product: "acme" });
  });

  it("keeps instanceof and a class per call", () => {
    expect(new PricingRoute(new SiteConfig())).toBeInstanceOf(Route);
    expect((Route as unknown as { name: string }).name).toBe("Route");
  });

  it("types the context by the route's path and layout", () => {
    expectTypeOf<RouteContext<ProductRoute>["params"]>().toEqualTypeOf<{
      readonly slug: string;
    }>();
    expectTypeOf<RouteContext<ProductRoute>["site"]>().toEqualTypeOf<{
      name: string;
      origin: string;
    }>();
    expectTypeOf<typeof ProductRoute>().toMatchTypeOf<RouteClass>();
  });
});
