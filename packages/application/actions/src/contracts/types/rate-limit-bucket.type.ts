/**
 * Stackra file contract:
 * Purpose: `RateLimitBucket`, the size of one token bucket: how many calls it holds and how fast it refills.
 * Boundary: a type only. The pipeline derives it from an action's `rateLimit` (`perMinute` holds and refills per
 *           minute) and from an API area's `RateLimitConfig` entry (`burst` holds, `requests` per `per` refills).
 * Runtime: isomorphic
 * Governing contract: ADR 0217 (decision 2: token buckets, enforced at the edge and in the pipeline).
 */

/** One token bucket. */
export interface RateLimitBucket {
  /** The most calls the bucket holds; a full bucket allows this many at once. */
  readonly capacity: number;

  /** Tokens added per second, up to `capacity`. */
  readonly tokensPerSecond: number;
}
