/**
 * Stackra file contract:
 * Purpose: `walkSitemapSource`, the one cursor walk behind `sitemapPage` and `sitemapFiles`: it checks the page size,
 *          asks the source page after page with a `limit` within the source's own ceiling, and hands each answer's
 *          items to a visitor until the visitor stops or the source has no next cursor.
 * Boundary: internal. A source that answers a cursor it already answered would loop for ever, so it throws instead.
 *           The walk keeps no items itself; the visitor decides what to keep.
 * Runtime: isomorphic
 * Governing contract: ADR 0301 (decision 2).
 */
import { SITEMAP_LIMITS } from "#core/constants/sitemap-limits.constant";
import type { SitemapContext } from "#core/types/sitemap-context.type";
import type { SitemapItem } from "#core/types/sitemap-item.type";
import type { SitemapSource } from "#core/types/sitemap-source.type";

/**
 * Walks `source` from its first page, calling `visit` with each answer's items; `visit` returns false to stop.
 *
 * @throws RangeError when `context.pageSize` is not a whole number from 1 to 50,000.
 * @throws Error when the source answers a cursor it answered before.
 */
export async function walkSitemapSource<Clients>(
  source: SitemapSource<Clients>,
  context: SitemapContext<Clients>,
  visit: (items: readonly SitemapItem[]) => boolean,
): Promise<void> {
  const { pageSize } = context;
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > SITEMAP_LIMITS.urls) {
    throw new RangeError(
      `The sitemap page size must be a whole number from 1 to ${SITEMAP_LIMITS.urls}`,
    );
  }
  const ceiling = source.maxLimit;
  const limit =
    ceiling !== undefined && ceiling >= 1 ? Math.min(pageSize, Math.floor(ceiling)) : pageSize;
  const seen = new Set<string>();
  let cursor: string | undefined;
  for (;;) {
    const answer = await source.list(
      context.clients,
      context.site,
      context.href,
      cursor === undefined ? { limit } : { cursor, limit },
    );
    if (!visit(answer.items)) return;
    const next = answer.nextCursor;
    if (next === undefined || next === "") return;
    if (seen.has(next)) throw new Error("A sitemap source answered the same cursor twice");
    seen.add(next);
    cursor = next;
  }
}
