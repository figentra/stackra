/**
 * Stackra file contract:
 * Purpose: `sitemapPage`, the items of one numbered sitemap file of one source: items `(page - 1) * pageSize` up to
 *          `page * pageSize`, gathered by walking the source's cursors.
 * Boundary: page 1 is always an answer (an empty source is a valid empty sitemap); a later page with no items is
 *           `null`, which the sitemap route answers with 404. The walk stops as soon as the page is full.
 * Runtime: isomorphic
 * Governing contract: ADR 0301 (decision 2).
 */
import { walkSitemapSource } from "#core/functions/walk-sitemap-source.function";
import type { SitemapContext } from "#core/types/sitemap-context.type";
import type { SitemapItem } from "#core/types/sitemap-item.type";
import type { SitemapSource } from "#core/types/sitemap-source.type";

/**
 * The items of page `context.page` of `source`, or `null` past the last page.
 *
 * @example
 * const items = await sitemapPage(source, { clients, site, href, page: 2, pageSize: 5_000 });
 * if (items === null) return new Response(null, { status: 404 });
 * @throws RangeError when the page is not a whole number from 1, or the page size not one from 1 to 50,000.
 */
export async function sitemapPage<Clients>(
  source: SitemapSource<Clients>,
  context: SitemapContext<Clients> & { readonly page: number },
): Promise<SitemapItem[] | null> {
  const { page, pageSize } = context;
  if (!Number.isInteger(page) || page < 1)
    throw new RangeError("A sitemap page is a whole number from 1");
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const items: SitemapItem[] = [];
  let index = 0;
  await walkSitemapSource(source, context, (batch) => {
    for (const item of batch) {
      if (index >= start && index < end) items.push(item);
      index++;
    }
    return index < end;
  });
  return page > 1 && items.length === 0 ? null : items;
}
