/**
 * Stackra file contract:
 * Purpose: unit tests of `walkSitemapSource`: it follows cursors to the end, stops when the visitor says so, asks
 *          within the source's own `limit` ceiling, passes clients, site and href through, refuses a page size outside
 *          1 to 50,000, and throws on a repeated cursor instead of looping.
 * Boundary: test only; the sources are in-memory lists.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0301 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { Changefreq } from "#core/enums/changefreq.enum";
import { walkSitemapSource } from "#core/functions/walk-sitemap-source.function";
import type { SitemapSource } from "#core/types/sitemap-source.type";

/** A source of `total` paths that pages by a numeric cursor. */
function pagedSource(total: number, maxLimit?: number) {
  const list = vi.fn<SitemapSource<string>["list"]>(
    async (_clients, _site, _href, { cursor, limit }) => {
      const start = cursor === undefined ? 0 : Number(cursor);
      const end = Math.min(total, start + limit);
      const items = Array.from({ length: end - start }, (_, index) => ({
        path: `/p/${start + index}`,
      }));
      return end < total ? { items, nextCursor: String(end) } : { items };
    },
  );
  const source: SitemapSource<string> = { changefreq: Changefreq.Daily, maxLimit, list };
  return { source, list };
}

/** The request the walk runs for. */
const CONTEXT = { clients: "clients", site: { siteId: "site_1" }, href: () => "/", pageSize: 10 };

describe("walkSitemapSource", () => {
  it("follows the cursors to the end", async () => {
    const { source, list } = pagedSource(25);
    const seen: string[] = [];
    await walkSitemapSource(source, CONTEXT, (items) => {
      seen.push(...items.map((item) => item.path));
      return true;
    });
    expect(seen).toHaveLength(25);
    expect(list).toHaveBeenCalledTimes(3);
    expect(list.mock.calls[0]?.[3]).toEqual({ limit: 10 });
    expect(list.mock.calls[1]?.[3]).toEqual({ cursor: "10", limit: 10 });
  });

  it("passes the clients, site and href to the source", async () => {
    const { source, list } = pagedSource(1);
    await walkSitemapSource(source, CONTEXT, () => true);
    expect(list.mock.calls[0]?.slice(0, 3)).toEqual([CONTEXT.clients, CONTEXT.site, CONTEXT.href]);
  });

  it("stops when the visitor returns false", async () => {
    const { source, list } = pagedSource(100);
    await walkSitemapSource(source, CONTEXT, () => false);
    expect(list).toHaveBeenCalledTimes(1);
  });

  it("asks no more than the source's own ceiling", async () => {
    const { source, list } = pagedSource(10, 4);
    await walkSitemapSource(source, CONTEXT, () => true);
    expect(list.mock.calls.map((call) => call[3].limit)).toEqual([4, 4, 4]);
  });

  it("refuses a page size outside 1 to 50,000", async () => {
    const { source } = pagedSource(1);
    for (const pageSize of [0, 50_001, 1.5]) {
      await expect(walkSitemapSource(source, { ...CONTEXT, pageSize }, () => true)).rejects.toThrow(
        RangeError,
      );
    }
  });

  it("throws on a repeated cursor instead of looping", async () => {
    const source: SitemapSource<string> = {
      changefreq: Changefreq.Daily,
      list: async () => ({ items: [{ path: "/" }], nextCursor: "same" }),
    };
    await expect(walkSitemapSource(source, CONTEXT, () => true)).rejects.toThrow(/same cursor/);
  });

  it("treats an empty cursor as the end", async () => {
    const list = vi.fn(async () => ({ items: [{ path: "/" }], nextCursor: "" }));
    await walkSitemapSource({ changefreq: Changefreq.Never, list }, CONTEXT, () => true);
    expect(list).toHaveBeenCalledTimes(1);
  });
});
