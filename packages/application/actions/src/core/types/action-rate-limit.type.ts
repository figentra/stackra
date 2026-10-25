/**
 * Stackra file contract:
 * Purpose: `ActionRateLimit`, an action's `rateLimit` option: how many calls a minute one caller, or one tenant, may
 *          make.
 * Boundary: a type only. The pipeline's rate-limit step keeps one token bucket per action and caller (or tenant) in the
 *           `RateLimitStore`, on top of the API area's bucket from `RateLimitConfig`.
 * Runtime: isomorphic
 * Governing contract: ADR 0217 (decision 2: token buckets enforced in the pipeline).
 */

/** An action's own rate limit. */
export interface ActionRateLimit {
  /** Calls per minute; also the most calls allowed at once. */
  readonly perMinute: number;

  /** Who shares the bucket: each principal (the default) or the whole tenant. */
  readonly by?: "principal" | "tenant";
}
