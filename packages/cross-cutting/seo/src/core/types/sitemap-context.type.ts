/**
 * Stackra file contract:
 * Purpose: `SitemapContext<Clients>`, what the sitemap walk needs from the request: the clients, the site, the link
 *          builder and how many URLs one sitemap file holds.
 * Boundary: a type only; the sitemap route modules build it from the route context and `SeoConfig.sitemapPageSize`.
 * Runtime: isomorphic
 * Governing contract: ADR 0301 (decision 2).
 */
import type { SitemapHref } from "#core/types/sitemap-href.type";
import type { SitemapSite } from "#core/types/sitemap-site.type";

/** The request a sitemap is written for. */
export interface SitemapContext<Clients> {
  /** The request's clients, passed to each source's `list`. */
  readonly clients: Clients;
  /** The request's site. */
  readonly site: SitemapSite;
  /** The route context's link builder. */
  readonly href: SitemapHref;
  /** URLs per sitemap file, 1 to 50,000. */
  readonly pageSize: number;
}
