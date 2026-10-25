/**
 * Stackra file contract:
 * Purpose: unit tests of `resolveHref`: a route ref through its registered path and params, a settings page, a path
 *          holder, a string as it is; the locale mount's lowercase prefix (none for the default); the query and
 *          fragment; an unregistered key or a pathless route refused.
 * Boundary: test only; clears the route table after each test.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0297 (decision 4); ADR 0307 (rule 24).
 */
import { Locale } from "@stackra/i18n";
import { LocaleUrlStrategy } from "@stackra/i18n";
import { afterEach, describe, expect, it } from "vitest";

import { Route } from "#core/bases/route.base";
import { ROUTE_TABLE } from "#core/constants/route-table.constant";
import { registerRoutes } from "#core/functions/register-routes.function";
import { resolveHref } from "#core/functions/resolve-href.function";
import { routeRef } from "#core/functions/route-ref.function";

class ProductRoute extends Route({ path: "/store/:slug" }) {}
class StoreRoute extends Route({ path: "/store" }) {}
class SignInRoute extends Route({ auth: false }) {}

const i18n = {
  locales: [Locale.En, Locale.Ar, Locale.ArSa],
  defaultLocale: Locale.En,
  urlStrategy: LocaleUrlStrategy.PrefixExceptDefault,
};

afterEach(() => {
  ROUTE_TABLE.clear();
});

describe("resolveHref", () => {
  it("resolves a route ref through its registered path", () => {
    registerRoutes({ product: ProductRoute, store: StoreRoute });
    expect(resolveHref(routeRef("product"), { slug: "tee" })).toBe("/store/tee");
    expect(
      resolveHref(routeRef("store"), { search: { collection: "summer", cursor: undefined } }),
    ).toBe("/store?collection=summer");
  });

  it("prefixes the locale mount, the default unprefixed", () => {
    registerRoutes({ product: ProductRoute });
    expect(resolveHref(routeRef("product"), { slug: "tee" }, { locale: Locale.ArSa, i18n })).toBe(
      "/ar-sa/store/tee",
    );
    expect(resolveHref(routeRef("product"), { slug: "tee" }, { locale: Locale.En, i18n })).toBe(
      "/store/tee",
    );
  });

  it("resolves a settings page, a path holder and a string", () => {
    const page = { key: "loyalty_kit", scope: "tenant", panels: [], fields: [] } as never;
    expect(resolveHref(page)).toBe("/settings/loyalty-kit");
    expect(resolveHref({ base: "/orders/orders" })).toBe("/orders/orders");
    expect(resolveHref({ path: "/portal" }, { hash: "top" })).toBe("/portal#top");
    expect(resolveHref("/ar/pricing", {}, { locale: Locale.En, i18n })).toBe("/ar/pricing");
  });

  it("refuses an unregistered key and a route with no path", () => {
    expect(() => resolveHref(routeRef("missing"))).toThrow(/registerRoutes/);
    registerRoutes({ sign_in: SignInRoute });
    expect(() => resolveHref(routeRef("sign_in"))).toThrow(/no path/);
  });
});
