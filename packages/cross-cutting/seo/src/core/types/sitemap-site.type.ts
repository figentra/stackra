/**
 * Stackra file contract:
 * Purpose: `SitemapSite`, what a sitemap source knows about the request's site: the public id that scopes its pages.
 * Boundary: a type only; the site layout's resolved site satisfies it structurally.
 * Runtime: isomorphic
 * Governing contract: ADR 0301 (decision 2); ADR 0175 (sites by host).
 */

/** The site a sitemap is written for. */
export interface SitemapSite {
  /** The public id of the site; builder pages are scoped by it. */
  readonly siteId: string;
}
