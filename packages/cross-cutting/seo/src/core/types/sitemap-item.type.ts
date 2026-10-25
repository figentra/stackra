/**
 * Stackra file contract:
 * Purpose: `SitemapItem`, one URL a sitemap source lists: its path inside the site, when it last changed and the image
 *          it shows.
 * Boundary: a type only. The path is site-relative; the sitemap route adds the origin and each locale's alternate.
 * Runtime: isomorphic
 * Governing contract: ADR 0301 (decision 2).
 */

/** One URL of a sitemap source. */
export interface SitemapItem {
  /** The site-relative path (`/store/blue-mug`). */
  readonly path: string;
  /** When the page last changed: an ISO 8601 string or a date. */
  readonly updatedAt?: string | Date | undefined;
  /** The absolute URL of the image the page shows. */
  readonly image?: string | undefined;
}
