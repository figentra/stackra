/**
 * Stackra file contract:
 * Purpose: unit tests of `sitemapFiles`: numbered files per source in the record's order, at least page 1 for an empty
 *          source, an exact multiple of the page size with no extra page, and the protocol ceiling of 50,000 URLs a
 *          file.
 * Boundary: test only; the sources are in-memory lists.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0301 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { Changefreq } from "#core/enums/changefreq.enum";
import { sitemapFiles } from "#core/functions/sitemap-files.function";
import type { SitemapSource } from "#core/types/sitemap-source.type";

/** A source of `total` paths in pages of `step`. */
function source(total: number, step = 1_000): SitemapSource<null> {
  return {
    changefreq: Changefreq.Daily,
    list: async (_clients, _site, _href, { cursor }) => {
      const start = cursor === undefined ? 0 : Number(cursor);
      const end = Math.min(total, start + step);
      const items = Array.from({ length: end - start }, () => ({ path: "/" }));
      return end < total ? { items, nextCursor: String(end) } : { items };
    },
  };
}

/** The request. */
const CONTEXT = { clients: null, site: { siteId: "site_1" }, href: () => "/" };

describe("sitemapFiles", () => {
  it("numbers each source's files in the record's order", async () => {
    const files = await sitemapFiles(
      { marketing: source(3), pages: source(0), products: source(11) },
      { ...CONTEXT, pageSize: 5 },
    );
    expect(files).toEqual([
      { source: "marketing", page: 1 },
      { source: "pages", page: 1 },
      { source: "products", page: 1 },
      { source: "products", page: 2 },
      { source: "products", page: 3 },
    ]);
  });

  it("adds no page for an exact multiple of the page size", async () => {
    expect(await sitemapFiles({ products: source(10) }, { ...CONTEXT, pageSize: 5 })).toHaveLength(
      2,
    );
  });

  it("keeps a file within 50,000 URLs", async () => {
    const files = await sitemapFiles(
      { products: source(100_001, 50_000) },
      { ...CONTEXT, pageSize: 50_000 },
    );
    expect(files.map((file) => file.page)).toEqual([1, 2, 3]);
  });

  it("refuses a page size above the protocol", async () => {
    await expect(
      sitemapFiles({ products: source(1) }, { ...CONTEXT, pageSize: 50_001 }),
    ).rejects.toThrow(RangeError);
  });
});
