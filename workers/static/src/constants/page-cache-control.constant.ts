/**
 * Stackra file contract:
 * Purpose: the Cache-Control value sent for the host's landing page at `/`.
 * Boundary: a constant only; render-headers.ts writes it into the generated `_headers` file.
 * Runtime: node
 * Governing contract: ADR 0284 (hosted static files, decision 4).
 */

/** Five minutes: the page changes only with a deploy, and a short life keeps a redeployed page from lingering. */
export const PAGE_CACHE_CONTROL = "public, max-age=300";
