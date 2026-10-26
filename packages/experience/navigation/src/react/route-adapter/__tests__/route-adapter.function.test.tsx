// @vitest-environment jsdom
/**
 * Stackra file contract:
 * Purpose: unit tests of `routeAdapter` in framework mode: the loader builds the context from the request's context
 *          keys (the layout's `site` once per request, `query` over the public clients), runs the class and resolves
 *          the head (the static `seo` translated, then `meta`); `meta` writes the head as tags; `render` draws the page
 *          with its data; a redirect becomes a router redirect; an unexpected error is reported once; a layout's
 *          loader answers its data as it is.
 * Boundary: test only; jsdom; the container is booted with config overrides, the public clients and the reporter are
 *           local fakes set on a `RouterContextProvider`.
 * Runtime: node (vitest, jsdom)
 * Governing contract: ADR 0022; ADR 0165 (framework mode); ADR 0301; ADR 0305 (rule 35).
 */
import { buildConfig } from "@stackra/config";
import { Container, type Token } from "@stackra/container";
import { I18nConfig } from "@stackra/i18n";
import { SeoConfig } from "@stackra/seo";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { createContext, MemoryRouter, RouterContextProvider } from "react-router";
import { vi } from "vitest";

import { Layout } from "#core/bases/layout.base";
import { Route } from "#core/bases/route.base";
import type { MetaContext } from "#core/types/meta-context.type";
import type { RouteContext } from "#core/types/route-context.type";
import type { RouteProps } from "#core/types/route-props.type";
import { routeAdapter } from "#react/route-adapter/route-adapter.function";

const GetProductBySlugQuery = { kind: "query", key: "commerce.product.by_slug@1" } as never;

class SiteLayout extends Layout {
  static runs = 0;

  override async loader() {
    SiteLayout.runs += 1;
    return { site: { name: "Acme", origin: "https://acme.test", indexable: true } };
  }
}

class ProductRoute extends Route({
  path: "/store/:slug",
  layout: SiteLayout,
  seo: { title: "web::product.title" },
}) {
  override async loader(ctx: RouteContext<this>) {
    if (ctx.params.slug === "old") return ctx.redirect("/store/new");
    if (ctx.params.slug === "boom") throw new Error("gateway down");
    const product = (await ctx.query(GetProductBySlugQuery, {
      slug: ctx.params.slug,
    } as never)) as {
      title: string;
    };
    return { product };
  }

  override meta({ data, site }: MetaContext<this>) {
    return {
      description: `${data.product.title} — ${site.name}`,
      jsonLd: [{ "@type": "Product", name: data.product.title }],
    };
  }
}

function Product({ data }: RouteProps<typeof ProductRoute>) {
  return <h1>{data.product.title}</h1>;
}

const keys = {
  container: createContext<Container>(),
  clients: createContext<() => { query: unknown; action: unknown }>(),
  reporter: createContext<{ report: (error: unknown) => void }>(),
};

/** The arguments React Router would give the loader for `slug`. */
async function argsFor(slug: string, report = vi.fn()) {
  const container = await Container.create([], {
    overrides: new Map<Token, object>([
      [I18nConfig, buildConfig(I18nConfig)],
      [SeoConfig, buildConfig(SeoConfig)],
    ]),
  });
  const context = new RouterContextProvider();
  context.set(keys.container, container);
  context.set(keys.clients, () => ({ query: async () => ({ title: "Tee" }), action: vi.fn() }));
  context.set(keys.reporter, { report });
  return {
    request: new Request(`http://worker.local/store/${slug}`),
    params: { slug },
    context,
  };
}

const adapter = routeAdapter(ProductRoute, {
  layout: SiteLayout,
  component: Product as never,
  keys: keys as never,
  t: () => (key) => `t:${key}`,
});

afterEach(() => {
  cleanup();
  SiteLayout.runs = 0;
});

describe("routeAdapter", () => {
  it("loads the data and resolves the head on the server", async () => {
    const answer = (await adapter.loader(await argsFor("tee"))) as { data: unknown; seo: unknown };
    expect(answer.data).toEqual({ product: { title: "Tee" } });
    expect(answer.seo).toMatchObject({
      title: "t:web::product.title",
      description: "Tee — Acme",
      canonical: "https://acme.test/store/tee",
      siteName: "Acme",
      noindex: false,
    });
    expect(SiteLayout.runs).toBe(1);
    const tags = adapter.meta({ loaderData: answer });
    expect(tags).toContainEqual({ title: "t:web::product.title" });
    expect(tags).toContainEqual({
      tagName: "link",
      rel: "canonical",
      href: "https://acme.test/store/tee",
    });
    expect(tags).toContainEqual({
      "script:ld+json": { "@context": "https://schema.org", "@type": "Product", name: "Tee" },
    });
  });

  it("renders the page with its data", async () => {
    const answer = await adapter.loader(await argsFor("tee"));
    render(
      <MemoryRouter>
        {adapter.render({ loaderData: answer, params: { slug: "tee" } })}
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { name: "Tee" })).toBeTruthy();
  });

  it("answers a redirect as a router redirect and reports an unexpected error once", async () => {
    const redirect = (await adapter.loader(await argsFor("old"))) as Response;
    expect(redirect.status).toBe(302);
    expect(redirect.headers.get("Location")).toBe("/store/new");
    const report = vi.fn();
    await expect(adapter.loader(await argsFor("boom", report))).rejects.toThrow("gateway down");
    expect(report).toHaveBeenCalledOnce();
  });

  it("answers a layout's data as it is", async () => {
    const layout = routeAdapter(SiteLayout, { keys: keys as never, t: () => (key) => key });
    expect(await layout.loader(await argsFor("tee"))).toEqual({
      site: { name: "Acme", origin: "https://acme.test", indexable: true },
    });
  });
});
