/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: every value the template imports (`Changefreq`, `OgKind`,
 *          `SeoConfig`, `alternates`, `robotsTxt`, `sitemapFiles`, `sitemapPage`, `writeSitemap`,
 *          `writeSitemapIndex`) and the rest of the SEO chain, with nothing internal leaking; the template's types
 *          (`Seo`, `SitemapSource`) checked by shape.
 * Boundary: test only; imports the stand-in barrel through its `#core` alias. Type exports are checked by type.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 15); ADR 0301.
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as core from "#core/index";
import type { Changefreq, Seo, SitemapItem, SitemapSource } from "#core/index";

describe("@stackra/seo", () => {
  it("exports exactly its public values at run time", () => {
    expect(Object.keys(core).sort()).toEqual([
      "Changefreq",
      "OgKind",
      "SeoConfig",
      "SeoConfig$",
      "alternates",
      "canonicalRedirect",
      "localePath",
      "resolveSeo",
      "robotsTxt",
      "serializeJsonLd",
      "sitemapFiles",
      "sitemapPage",
      "writeSitemap",
      "writeSitemapIndex",
    ]);
  });

  it("types a route's meta() return as the template writes it", () => {
    const seo: Seo = {
      title: "Blue mug",
      description: undefined,
      noindex: false,
      image: "https://acme.test/og/product/blue-mug",
      type: "product",
      jsonLd: [{ "@type": "Product", sku: undefined }],
    };
    expect(seo.type).toBe("product");
  });

  it("types a sitemap source as the generated sitemap file writes it", () => {
    const source: SitemapSource<{ query: () => Promise<string[]> }> = {
      changefreq: core.Changefreq.Daily,
      maxLimit: 100,
      list: async (clients, site, href, { cursor, limit }) => ({
        items: (await clients.query()).map((slug) => ({
          path: href({ key: "product" }, { slug }),
        })),
        ...(cursor ? { nextCursor: `${cursor}${limit}${site.siteId}` } : {}),
      }),
    };
    expectTypeOf(source.changefreq).toEqualTypeOf<Changefreq>();
    expectTypeOf<Awaited<ReturnType<typeof source.list>>["items"]>().toEqualTypeOf<
      readonly SitemapItem[]
    >();
  });
});
