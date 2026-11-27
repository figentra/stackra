/**
 * Stackra file contract:
 * Purpose: `BROWSER_LOG_LIMITS`, how much the browser log takes: a request body of at most 64 KiB, at most 50 entries
 *          per request, and at most 200 entries per page load (the client then sends one line saying it stopped).
 * Boundary: numbers only; the dev server applies the body and entry limits, the client the per-page one.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 5); STA-2889.
 */

/** The browser log's limits. */
export const BROWSER_LOG_LIMITS = Object.freeze({
  /** The largest request body the dev server reads, in bytes. */
  bodyBytes: 64 * 1024,
  /** The most entries one request may carry. */
  entries: 50,
  /** The most entries one page load sends. */
  perPage: 200,
});
