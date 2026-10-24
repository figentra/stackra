/**
 * Stackra file contract:
 * Purpose: `RateLimit`, one entry of an Integration's `rateLimits`: the provider's documented limit, which the
 *          managed client keeps to before a call leaves.
 * Boundary: a type only. The client turns it into a token bucket of `requests` refilled over `per`, kept in the
 *           `RateLimitStore` of `@stackra/actions`, one bucket per credential or one for the provider.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rule 13); ADR 0217 (token buckets).
 */
import type { RateLimitScope } from "#core/enums/rate-limit-scope.enum";
import type { Interval } from "#core/types/interval.type";

/**
 * A provider rate limit.
 *
 * @example
 * const limit: RateLimit = { requests: 10, per: "1s", by: RateLimitScope.Credential };
 */
export interface RateLimit {
  /** How many calls the provider allows per window; a whole number from 1. */
  readonly requests: number;

  /** The window. */
  readonly per: Interval;

  /** What the limit counts against. */
  readonly by: RateLimitScope;
}
