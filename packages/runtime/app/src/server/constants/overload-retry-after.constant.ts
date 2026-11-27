/**
 * Stackra file contract:
 * Purpose: `OVERLOAD_RETRY_AFTER_MS`, the wait a shed call is told to keep before it is sent again (`Retry-After: 1`):
 *          long enough for the calls in flight to free places, short enough that a client retrying with its own
 *          backoff loses little.
 * Boundary: a constant read by the server `createApp` when it builds `AppOverloadedError`.
 * Runtime: node
 * Governing contract: ADR 0140 (a retryable refusal); RFC 9110 section 10.2.3 (`Retry-After` on 503); STA-1467.
 */

/** One second, in milliseconds. */
export const OVERLOAD_RETRY_AFTER_MS = 1000;
