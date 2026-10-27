/**
 * Stackra file contract:
 * Purpose: unit tests of `createRouteContext`: params, query, path and the mount's locale; `href` and `redirect`;
 *          `data`, `fieldErrors` and `notFound`; `query` and `action` through the caller (a refusal as `{ ok: false }`);
 *          `formData`; `redirectToCanonical`; `navigate`; container members and their refusal without a container; the
 *          layout's data, contributed parts and extra members, later winning; invalid params as a 404.
 * Boundary: test only; the caller and the platform are local fakes, the container is booted with overrides.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decisions 16 and 17); ADR 0301 (decision 5).
 */
import { buildConfig } from "@stackra/config";
import { Container, type Token } from "@stackra/container";
import { ErrorKind, Refusal } from "@stackra/errors";
import { I18nConfig, Locale } from "@stackra/i18n";
import { Platform } from "@stackra/platform/contracts";
import { afterEach, describe, expect, it } from "vitest";
import { registerSchemas, Schema } from "@stackra/validation";
import { vi } from "vitest";
import { z } from "zod";

import { Route } from "#core/bases/route.base";
import { ROUTE_CONTEXT_PARTS } from "#core/constants/route-context-parts.constant";
import { ROUTE_TABLE } from "#core/constants/route-table.constant";
import { contributeRouteContext } from "#core/functions/contribute-route-context.function";
import { createRouteContext } from "#core/functions/create-route-context.function";
import { isRouteResponse } from "#core/functions/is-route-response.function";
import { registerRoutes } from "#core/functions/register-routes.function";
import { routeRef } from "#core/functions/route-ref.function";

class OrderDetailParams extends Schema {
  orderId!: string;
}

registerSchemas([[OrderDetailParams, z.object({ orderId: z.string().startsWith("ord_") })]]);

class ProductRoute extends Route({ path: "/store/:slug" }) {}
class OrderDetailRoute extends Route({
  path: "/orders/:orderId",
  params: OrderDetailParams,
}) {}

class RateLimitedError extends Refusal({ kind: ErrorKind.RateLimited }) {}

class SiteI18nConfig extends I18nConfig {
  override locales: Locale[] = [Locale.En, Locale.ArSa];
}

/** A container whose I18nConfig ships English and Saudi Arabic. */
async function containerWith(
  extra: readonly (readonly [Token, object])[] = [],
): Promise<Container> {
  return Container.create([], {
    overrides: new Map<Token, object>([[I18nConfig, buildConfig(SiteI18nConfig)], ...extra]),
  });
}

afterEach(() => {
  ROUTE_TABLE.clear();
  ROUTE_CONTEXT_PARTS.clear();
});

describe("createRouteContext", () => {
  it("reads params, query, path and the mount's locale", async () => {
    const ctx = createRouteContext({
      type: ProductRoute,
      request: new Request("http://localhost/ar-sa/store/tee?ref=mail"),
      params: { slug: "tee" },
      container: await containerWith(),
    });
    expect(ctx.params).toEqual({ slug: "tee" });
    expect(ctx.search).toEqual({ ref: "mail" });
    expect(ctx.path).toBe("/ar-sa/store/tee?ref=mail");
    expect(ctx.locale).toBe("ar-SA");
  });

  it("resolves hrefs in the mount and builds redirects", async () => {
    registerRoutes({ product: ProductRoute });
    const ctx = createRouteContext({
      type: ProductRoute,
      request: new Request("http://localhost/ar-sa/store/tee"),
      container: await containerWith(),
    });
    expect(ctx.href(routeRef("product"), { slug: "cap" })).toBe("/ar-sa/store/cap");
    expect(ctx.redirect(routeRef("product"), { slug: "cap" })).toEqual({
      redirect: { name: "product" },
      params: { slug: "cap" },
    });
  });

  it("answers data, field errors and not found", () => {
    const ctx = createRouteContext({
      type: ProductRoute,
      request: new Request("http://localhost/"),
    });
    expect(ctx.data({ sent: true }, { status: 201 })).toMatchObject({
      data: { sent: true },
      status: 201,
    });
    const refusal = RateLimitedError.create({}, { fieldErrors: { email: "too_many" } });
    expect(ctx.fieldErrors(refusal)).toMatchObject({
      data: { fieldErrors: { email: "too_many" } },
      status: 400,
    });
    const notFound = ctx.notFound({ code: "page_not_found" });
    expect(isRouteResponse(notFound) && notFound.status).toBe(404);
  });

  it("calls the caller, a refusal as { ok: false }", async () => {
    const caller = {
      // The port's query is generic over the query; this stub answers the one query the test sends.
      query: vi.fn(async () => ({ total: 3 }) as never),
      action: vi.fn(async () => {
        throw RateLimitedError.create();
      }),
    };
    const ctx = createRouteContext({
      type: ProductRoute,
      request: new Request("http://localhost/"),
      caller,
    });
    const query = { kind: "query", key: "orders.order.kpis@1" } as never;
    expect(await ctx.query(query, {} as never, { staleTime: "30s" })).toEqual({ total: 3 });
    expect(caller.query).toHaveBeenCalledWith(
      query,
      {},
      expect.objectContaining({ staleTime: "30s" }),
    );
    const result = await ctx.action({ kind: "action" } as never, {} as never);
    expect(result.ok).toBe(false);
  });

  it("refuses query, platform and config without what they need", () => {
    const ctx = createRouteContext({
      type: ProductRoute,
      request: new Request("http://localhost/"),
    });
    expect(() => ctx.query({} as never, {} as never)).toThrow(/RouteCaller/);
    expect(() => ctx.platform).toThrow(/container/);
    expect(() => ctx.config(I18nConfig)).toThrow(/container/);
  });

  it("reads the platform from the container lazily", async () => {
    const platform = { has: () => true } as unknown as Platform;
    const ctx = createRouteContext({
      type: ProductRoute,
      request: new Request("http://localhost/"),
      container: await containerWith([[Platform, platform]]),
    });
    expect(ctx.platform).toBe(platform);
  });

  it("reads the submitted form", async () => {
    const body = new FormData();
    body.append("lines.0.quantity", "2");
    const ctx = createRouteContext({
      type: ProductRoute,
      request: new Request("http://localhost/", { method: "POST", body }),
    });
    expect(await ctx.formData()).toEqual({ lines: [{ quantity: "2" }] });
  });

  it("redirects a renamed slug to its canonical URL", () => {
    const ctx = createRouteContext({
      type: ProductRoute,
      request: new Request("http://localhost/store/old-tee?utm=1"),
      params: { slug: "old-tee" },
    });
    expect(() => ctx.redirectToCanonical("old-tee")).not.toThrow();
    let thrown: unknown;
    try {
      ctx.redirectToCanonical("tee");
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toBeInstanceOf(Response);
    expect((thrown as Response).status).toBe(301);
    expect((thrown as Response).headers.get("Location")).toBe("http://localhost/store/tee?utm=1");
  });

  it("navigates outside through the adapter and inside by a redirect", () => {
    const navigate = vi.fn();
    const ctx = createRouteContext({
      type: ProductRoute,
      request: new Request("http://localhost/"),
      navigate,
    });
    ctx.navigate("https://login.acme.test", { external: true });
    expect(navigate).toHaveBeenCalledWith("https://login.acme.test", { external: true });
    const plain = createRouteContext({
      type: ProductRoute,
      request: new Request("http://localhost/"),
    });
    expect(() => plain.navigate("/settings")).toThrow(
      expect.objectContaining({ redirect: "/settings" }),
    );
  });

  it("spreads the layout's data, then the parts, then the members", () => {
    contributeRouteContext(() => ({ session: "from-part", actor: "part" }) as never);
    const ctx = createRouteContext({
      type: ProductRoute,
      request: new Request("http://localhost/"),
      layoutData: { site: { name: "Acme" }, actor: "layout" },
      members: { session: "from-test" },
    }) as unknown as Record<string, unknown>;
    expect(ctx["site"]).toEqual({ name: "Acme" });
    expect(ctx["actor"]).toBe("part");
    expect(ctx["session"]).toBe("from-test");
  });

  it("validates params with the route's shape, a 404 when they break it", () => {
    const ok = createRouteContext({
      type: OrderDetailRoute,
      request: new Request("http://localhost/orders/ord_1"),
      params: { orderId: "ord_1" },
    });
    expect(ok.params).toMatchObject({ orderId: "ord_1" });
    expect(() =>
      createRouteContext({
        type: OrderDetailRoute,
        request: new Request("http://localhost/orders/1"),
        params: { orderId: "1" },
      }),
    ).toThrow(expect.objectContaining({ status: 404 }));
  });
});
