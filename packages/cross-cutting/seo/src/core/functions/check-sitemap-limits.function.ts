/**
 * Stackra file contract:
 * Purpose: `checkSitemapLimits`, the protocol check of one written sitemap or sitemap index: at most 50,000 URLs and
 *          50 MB uncompressed.
 * Boundary: internal; the writers call it before they return the XML, so a file crawlers would reject is never
 *           served.
 * Runtime: isomorphic
 * Governing contract: ADR 0301 (decision 2); the sitemaps.org protocol 0.9.
 */
import { SITEMAP_LIMITS } from "#core/constants/sitemap-limits.constant";

/**
 * Returns `xml` when it is within the protocol limits.
 *
 * @param count - how many `<url>` or `<sitemap>` elements `xml` holds.
 * @throws RangeError when the file holds more than 50,000 URLs or more than 50 MB.
 */
export function checkSitemapLimits(xml: string, count: number): string {
  if (count > SITEMAP_LIMITS.urls) {
    throw new RangeError(
      `A sitemap file holds ${count} URLs; the protocol allows ${SITEMAP_LIMITS.urls}`,
    );
  }
  // a UTF-16 length above the limit cannot be under it in UTF-8, so only measure when it could matter
  if (xml.length * 3 > SITEMAP_LIMITS.bytes) {
    const bytes = new TextEncoder().encode(xml).byteLength;
    if (bytes > SITEMAP_LIMITS.bytes) {
      throw new RangeError(
        `A sitemap file is ${bytes} bytes; the protocol allows ${SITEMAP_LIMITS.bytes}`,
      );
    }
  }
  return xml;
}
