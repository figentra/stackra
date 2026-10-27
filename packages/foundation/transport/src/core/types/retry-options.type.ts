/**
 * Stackra file contract:
 * Purpose: `RetryOptions`, what `retry` takes: the shared `RetryPolicy` (attempts, waits, curve, jitter, `retryOn`)
 *          plus the transport's own `maxWait` for a `Retry-After`.
 * Boundary: a type only. Whatever the options say, a request that is not safe to repeat is sent once. The waits
 *           default to 200 ms doubling, at most 5 s, as the transport's own formula did before stackra-223; `retryOn`
 *           replaced the `network` and `refused` switches (`RetryOn.Network` is `refused: false`).
 * Runtime: isomorphic
 * Governing contract: ADR 0140 (retryable kinds); ADR 0138 (idempotency); owner D10 2026-10-28 (stackra-223: one
 *                     `RetryPolicy`).
 */
import type { Duration, RetryPolicy } from "@stackra/contracts";

/** The retry policy of one transport. */
export interface RetryOptions extends RetryPolicy {
  /** A `Retry-After` longer than this returns the refused response instead of waiting. Default 30 seconds. */
  readonly maxWait?: Duration;
}
