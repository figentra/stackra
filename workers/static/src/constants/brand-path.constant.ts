/**
 * Stackra file contract:
 * Purpose: the URL path prefix of the brand kit images on the static host, `/brand`.
 * Boundary: a constant only; render-headers.ts gives it the immutable cache rule.
 * Runtime: node
 * Governing contract: ADR 0284 (hosted static files, decision 2 and the 2026-11-01 note).
 */

/** Path prefix of the brand kind, without a trailing slash: `/brand/<kit>/<ref>/<path in the kit>`. Every ref is pinned. */
export const BRAND_PATH = "/brand";
