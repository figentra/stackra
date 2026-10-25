/**
 * Stackra file contract:
 * Purpose: `SitemapSource<Clients>`, one named list of sitemap URLs (`marketing`, `pages`, `products`): how often its
 *          pages change, its own page-size ceiling, and `list`, which answers one cursor page or everything at once.
 * Boundary: a type only; gen writes `#stackra/sitemap` as a record of these. `sitemapPage` and `sitemapFiles` walk
 *           the cursors and split the items into protocol-sized files; a source never pages for the sitemap itself.
 * Runtime: isomorphic
 * Governing contract: ADR 0301 (decision 2).
 */
import type { Changefreq } from "#core/enums/changefreq.enum";
import type { SitemapHref } from "#core/types/sitemap-href.type";
import type { SitemapItem } from "#core/types/sitemap-item.type";
import type { SitemapSite } from "#core/types/sitemap-site.type";

/** One sitemap source over the request's clients. */
export interface SitemapSource<Clients> {
  /** How often the source's pages change. */
  readonly changefreq: Changefreq;
  /** The largest `limit` the source's query accepts; the walk never asks for more. */
  readonly maxLimit?: number | undefined;
  /**
   * One page of the source after `cursor`, about `limit` items, with the cursor of the next page; a source without
   * paging answers everything and no cursor.
   */
  list(
    clients: Clients,
    site: SitemapSite,
    href: SitemapHref,
    page: { readonly cursor?: string; readonly limit: number },
  ): Promise<{ readonly items: readonly SitemapItem[]; readonly nextCursor?: string | undefined }>;
}
