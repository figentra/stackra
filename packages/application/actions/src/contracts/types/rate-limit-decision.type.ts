/**
 * Stackra file contract:
 * Purpose: `RateLimitDecision`, what a `RateLimitStore` answers for one call: allowed or not, the tokens left and how
 *          long until the next one.
 * Boundary: a type only. The pipeline refuses a call that is not allowed with `RateLimitedError`, carrying
 *           `retryAfterMs`, which the generated adapter turns into the `RateLimit-*` and `Retry-After` headers.
 * Runtime: isomorphic
 * Governing contract: ADR 0217 (decision 2).
 */

/** The answer of one token take. */
export interface RateLimitDecision {
  /** Whether a token was taken. */
  readonly allowed: boolean;

  /** Whole tokens left after this take. */
  readonly remaining: number;

  /** Milliseconds until a token is free; `0` when the call was allowed. */
  readonly retryAfterMs: number;
}
