/**
 * Stackra file contract:
 * Purpose: `SitemapFile`, one file the sitemap index lists: a source name and a page number
 *          (`/sitemaps/<source>-<page>.xml`).
 * Boundary: a type only; `sitemapFiles` returns them in source order, page 1 first.
 * Runtime: isomorphic
 * Governing contract: ADR 0301 (decision 2).
 */

/** One numbered sitemap file of one source. */
export interface SitemapFile {
  /** The source's name. */
  readonly source: string;
  /** The page number, from 1. */
  readonly page: number;
}
