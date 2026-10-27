/**
 * Stackra file contract:
 * Purpose: `writeSitemapIndex`, the sitemap index as XML: one `<sitemap>` per absolute sitemap file URL, in the order
 *          given.
 * Boundary: a pure function; every URL is escaped. It refuses an index above the protocol limits (50,000 files,
 *           50 MB).
 * Runtime: isomorphic
 * Governing contract: ADR 0301 (decision 2); the sitemaps.org protocol 0.9.
 */
import { escapeXml } from "@stackra/support";

import { checkSitemapLimits } from "#core/functions/check-sitemap-limits.function";

/** The opening of a sitemap index. */
const OPEN =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

/**
 * The XML of the sitemap index.
 *
 * @example
 * writeSitemapIndex(files.map(({ source, page }) => `${site.origin}/sitemaps/${source}-${page}.xml`));
 * @throws RangeError when the index exceeds 50,000 files or 50 MB.
 * @throws TypeError when a URL holds a character XML cannot carry.
 */
export function writeSitemapIndex(locations: readonly string[]): string {
  const body = locations
    .map((loc) => `  <sitemap><loc>${escapeXml(loc)}</loc></sitemap>`)
    .join("\n");
  return checkSitemapLimits(`${OPEN}${body}${body ? "\n" : ""}</sitemapindex>\n`, locations.length);
}
