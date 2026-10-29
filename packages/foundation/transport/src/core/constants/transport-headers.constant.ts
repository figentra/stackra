/**
 * Stackra file contract:
 * Purpose: `TRANSPORT_HEADERS`, the names of the headers the pipeline reads and writes, so a client, a fake server and
 *          a test spell them once.
 * Boundary: frozen; header names only (HTTP compares them case-insensitively, `Headers` too).
 * Runtime: isomorphic
 * Governing contract: ADR 0118 (`Stackra-Version`); ADR 0138 (`Idempotency-Key`); ADR 0217 (`Retry-After`); ADR 0184
 *                     (W3C `traceparent`).
 */

/**
 * The header names of the transport.
 *
 * @example
 * request.headers.get(TRANSPORT_HEADERS.idempotencyKey);
 */
export const TRANSPORT_HEADERS = Object.freeze({
  /** `Bearer <token>`, set by `bearerToken`. */
  authorization: "Authorization",
  /** One key per logical call, kept across retries, set by `idempotencyKey`. */
  idempotencyKey: "Idempotency-Key",
  /** The dated API version (`2027-03-01`), set by `stackraVersion`. */
  stackraVersion: "Stackra-Version",
  /** The W3C trace context of the calling span, set by `traceContext`. */
  traceparent: "traceparent",
  /** Seconds or an HTTP date on a 429 or 503, read by `retry`. */
  retryAfter: "Retry-After",
});
