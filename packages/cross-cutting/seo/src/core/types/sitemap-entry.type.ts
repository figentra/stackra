/**
 * Stackra file contract:
 * Purpose: `SitemapEntry`, one `<url>` that `writeSitemap` writes: the absolute location, last change, change
 *          frequency, hreflang alternates and image locations.
 * Boundary: a type only; every URL is absolute, and the writer escapes every value.
 * Runtime: isomorphic
 * Governing contract: ADR 0301 (decision 2); the sitemaps.org protocol 0.9 and the image and xhtml extensions.
 */
import type { Changefreq } from "#core/enums/changefreq.enum";

/** One URL of a sitemap file. */
export interface SitemapEntry {
  /** The absolute URL of the page. */
  readonly loc: string;
  /** When the page last changed: an ISO 8601 string or a date. */
  readonly lastmod?: string | Date | undefined;
  /** How often the page changes. */
  readonly changefreq?: Changefreq | undefined;
  /** hreflang to absolute URL, `x-default` included. */
  readonly alternates?: Readonly<Record<string, string>> | undefined;
  /** Absolute image URLs the page shows. */
  readonly images?: readonly string[] | undefined;
}
