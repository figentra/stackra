/**
 * Stackra file contract:
 * Purpose: unit tests of `routeMeta` over the template's product test: the head of the route's data comes back as meta
 *          descriptors (the static title translated, the canonical on the site's origin, `meta`'s description and
 *          JSON-LD with the site from the input), and a missing container is refused.
 * Boundary: test only; the container holds the default `I18nConfig` and `SeoConfig`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269 (decisions 3 and 6); ADR 0301.
 */
import { buildConfig } from "@stackra/config";
import { Container, type Token } from "@stackra/container";
import { I18nConfig } from "@stackra/i18n";
import { SeoConfig } from "@stackra/seo";
import { describe, expect, it } from "vitest";

import { Layout } from "#core/bases/layout.base";
import { Route } from "#core/bases/route.base";
import type { MetaContext } from "#core/types/meta-context.type";
import { routeMeta } from "#testing/functions/route-meta.function";

class SiteLayout extends Layout {
  override loader() {
    return { site: { name: "Acme", origin: "https://acme.test", indexable: true } };
  }
}

class ProductRoute extends Route({
  path: "/store/:slug",
  layout: SiteLayout,
  seo: { title: "web::product.title" },
}) {
  override loader() {
    return { product: { title: "Tee" } };
  }

  override meta({ data, site }: MetaContext<this>) {
    return {
      description: `${data.product.title} — ${site.name}`,
      jsonLd: [{ "@type": "Product", name: data.product.title }],
    };
  }
}

const SITE = { name: "Acme", origin: "https://acme.test", indexable: true };

describe("routeMeta", () => {
  it("resolves the route's head for its data as meta descriptors", async () => {
    const container = await Container.create([], {
      overrides: new Map<Token, object>([
        [I18nConfig, buildConfig(I18nConfig)],
        [SeoConfig, buildConfig(SeoConfig)],
      ]),
    });
    const descriptors = routeMeta(ProductRoute, {
      data: { product: { title: "Tee" } },
      site: SITE,
      path: "/store/tee",
      params: { slug: "tee" },
      container,
      t: (key) => `t:${key}`,
    });
    expect(descriptors).toContainEqual({ title: "t:web::product.title" });
    expect(descriptors).toContainEqual({
      tagName: "link",
      rel: "canonical",
      href: "https://acme.test/store/tee",
    });
    expect(descriptors).toContainEqual({ name: "description", content: "Tee — Acme" });
    expect(descriptors).toContainEqual({ "script:ld+json": { "@type": "Product", name: "Tee" } });
  });

  it("refuses without a container to read SeoConfig from", () => {
    expect(() => routeMeta(ProductRoute, { data: null })).toThrow(TypeError);
  });
});
