/**
 * Stackra file contract:
 * Purpose: unit tests of `sitemapPage`: the window of each page across cursor boundaries, a source without paging
 *          split by the helper, page 1 of an empty source as an empty list, `null` past the last page, the early
 *          stop once the page is full, and the refusal of a page that is not a whole number from 1.
 * Boundary: test only; the sources are in-memory lists.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0301 (decision 2).
 */
import { describe, expect, it, vi } from "@stackra/testing";

import { Changefreq } from "#core/enums/changefreq.enum";
import { sitemapPage } from "#core/functions/sitemap-page.function";
import type { SitemapSource } from "#core/types/sitemap-source.type";

/** A source of `total` paths that pages by a numeric cursor, `step` items per answer. */
function pagedSource(total: number, step = 3): SitemapSource<null> {
  return {
    changefreq: Changefreq.Daily,
    list: vi.fn<SitemapSource<null>["list"]>(async (_clients, _site, _href, { cursor }) => {
      const start = cursor === undefined ? 0 : Number(cursor);
      const end = Math.min(total, start + step);
      const items = Array.from({ length: end - start }, (_, index) => ({
        path: `/p/${start + index}`,
      }));
      return end < total ? { items, nextCursor: String(end) } : { items };
    }),
  };
}

/** The request, five URLs per file. */
const CONTEXT = { clients: null, site: { siteId: "site_1" }, href: () => "/", pageSize: 5 };

describe("sitemapPage", () => {
  it("answers each page's window across cursor boundaries", async () => {
    const source = pagedSource(12);
    const one = await sitemapPage(source, { ...CONTEXT, page: 1 });
    const two = await sitemapPage(source, { ...CONTEXT, page: 2 });
    const three = await sitemapPage(source, { ...CONTEXT, page: 3 });
    expect(one?.map((item) => item.path)).toEqual(["/p/0", "/p/1", "/p/2", "/p/3", "/p/4"]);
    expect(two?.map((item) => item.path)).toEqual(["/p/5", "/p/6", "/p/7", "/p/8", "/p/9"]);
    expect(three?.map((item) => item.path)).toEqual(["/p/10", "/p/11"]);
  });

  it("is null past the last page", async () => {
    expect(await sitemapPage(pagedSource(10), { ...CONTEXT, page: 3 })).toBeNull();
  });

  it("answers page 1 of an empty source with an empty list", async () => {
    expect(await sitemapPage(pagedSource(0), { ...CONTEXT, page: 1 })).toEqual([]);
    expect(await sitemapPage(pagedSource(0), { ...CONTEXT, page: 2 })).toBeNull();
  });

  it("splits a source that answers everything at once", async () => {
    const source: SitemapSource<null> = {
      changefreq: Changefreq.Weekly,
      list: async () => ({
        items: Array.from({ length: 7 }, (_, index) => ({ path: `/${index}` })),
      }),
    };
    expect((await sitemapPage(source, { ...CONTEXT, page: 2 }))?.map((item) => item.path)).toEqual([
      "/5",
      "/6",
    ]);
  });

  it("stops walking once the page is full", async () => {
    const source = pagedSource(1_000);
    const list = vi.spyOn(source, "list");
    await sitemapPage(source, { ...CONTEXT, page: 1 });
    expect(list).toHaveBeenCalledTimes(2); // 3 + 3 items cover the first five
  });

  it("refuses a page that is not a whole number from 1", async () => {
    for (const page of [0, -1, 1.5]) {
      await expect(sitemapPage(pagedSource(1), { ...CONTEXT, page })).rejects.toThrow(RangeError);
    }
  });
});
