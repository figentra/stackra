/**
 * Stackra file contract:
 * Purpose: `SITEMAP_LIMITS`, the sitemap protocol's ceilings: 50,000 URLs and 50 MB (52,428,800 bytes) uncompressed
 *          per file, for a sitemap and for a sitemap index alike.
 * Boundary: internal; the paging checks the page size against `urls`, and the writers refuse a file above either.
 * Runtime: isomorphic
 * Governing contract: ADR 0301 (decision 2); the sitemaps.org protocol 0.9.
 */

/** The ceilings of one sitemap or sitemap index file. */
export const SITEMAP_LIMITS = Object.freeze({ urls: 50_000, bytes: 52_428_800 });
