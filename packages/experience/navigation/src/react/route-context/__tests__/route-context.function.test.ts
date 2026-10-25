/**
 * Stackra file contract:
 * Purpose: unit tests of `routeContext` for resource route modules: the mount's locale, a config from the container, a
 *          layout's data shared within the request, a public query and the clients, localised hrefs, and the named
 *          refusals when the container or the clients key is missing.
 * Boundary: test only; the container is booted with overrides, the public clients are a local fake set on a
 *           `RouterContextProvider`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0297; ADR 0301.
 */
import { buildConfig } from "@stackra/config";
import { Container, type Token } from "@stackra/container";
import { I18nConfig, Locale } from "@stackra/i18n";
import { SeoConfig } from "@stackra/seo";
import { describe, expect, it } from "@stackra/testing";
import { createContext, RouterContextProvider } from "react-router";
import { vi } from "vitest";

import { Layout } from "#core/bases/layout.base";
import { routeContext } from "#react/route-context/route-context.function";

class SiteLayout extends Layout {
  override async loader(): Promise<{ site: { origin: string } }> {
    return { site: { origin: "https://acme.test" } };
  }
}

class SiteI18nConfig extends I18nConfig {
  override locales: Locale[] = [Locale.En, Locale.Ar];
}

const keys = {
  container: createContext<Container>(),
  clients: createContext<() => { query: unknown; action: unknown }>(),
};

describe("routeContext", () => {
  it("reads the locale, configs, layouts, clients and hrefs of the request", async () => {
    const container = await Container.create([], {
      overrides: new Map<Token, object>([
        [I18nConfig, buildConfig(SiteI18nConfig)],
        [SeoConfig, buildConfig(SeoConfig)],
      ]),
    });
    const query = vi.fn(async () => ({ entries: [] }));
    const context = new RouterContextProvider();
    context.set(keys.container, container);
    context.set(keys.clients, () => ({ query, action: vi.fn() }));
    const request = new Request("http://worker.local/ar/sitemap.xml");
    const ctx = routeContext({ request, params: {}, context }, keys as never);
    expect(ctx.locale).toBe("ar");
    expect(ctx.config(SeoConfig).sitemapPageSize).toBe(10_000);
    const first = ctx.layout(SiteLayout);
    expect(await first).toEqual({ site: { origin: "https://acme.test" } });
    expect(ctx.layout(SiteLayout)).toBe(first);
    expect(await ctx.query({ kind: "query" } as never, {} as never)).toEqual({ entries: [] });
    expect(ctx.clients.query).toBe(query);
    expect(ctx.href("/pricing")).toBe("/pricing");
    expect(ctx.href({ path: "/pricing" })).toBe("/ar/pricing");
  });

  it("names the missing key when a member needs it", () => {
    const ctx = routeContext(
      { request: new Request("http://worker.local/robots.txt"), params: {} },
      keys as never,
    );
    expect(ctx.locale).toBe("en");
    expect(() => ctx.config(SeoConfig)).toThrow(/container/);
    expect(() => ctx.clients).toThrow(/clients/);
  });
});
