/**
 * Stackra file contract:
 * Purpose: `RateLimitedError`, the core refusal when the caller made too many calls in the current window, with the
 *          refusing bucket's back-off hint: `retryAfterMs`, `limit` and `remaining`.
 * Boundary: a core refusal: raised by the rate-limit step of the action pipeline. Kind `RateLimited`, code
 *           `rate_limited`. Its details are the bucket's numbers only, never the bucket key, so nothing about the
 *           caller or the refused call travels with it; the MCP envelope carries them as `details`, and the HTTP
 *           adapter turns them into `Retry-After` and `RateLimit-*` through `rateLimitHeaders`. Every detail is
 *           optional: a refusal raised without a bucket (`create()`) still has the plain envelope.
 * Runtime: isomorphic
 * Governing contract: ADR 0140 (envelope and kinds), ADR 0294 (decisions 16 and 20), ADR 0217 (decision 2: the
 *                     `RateLimit-*` headers are sent); STA-1477.
 */
import { Refusal } from "#core/bases/refusal.base";
import { ErrorKind } from "#core/enums/error-kind.enum";

/**
 * Retryable: the same call succeeds once the bucket refills.
 *
 * @example
 * throw RateLimitedError.create({ retryAfterMs: 3000, limit: 20, remaining: 0 });
 */
export class RateLimitedError extends Refusal({
  kind: ErrorKind.RateLimited,
  retryable: true,
}) {
  /** Milliseconds until the refusing bucket holds a token again; absent when it never refills. */
  retryAfterMs?: number;

  /** The refusing bucket's capacity (its burst). */
  limit?: number;

  /** Whole tokens left in the refusing bucket (0 when refused). */
  remaining?: number;
}
