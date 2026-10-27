/**
 * Stackra file contract:
 * Purpose: `RateLimit`, one entry of an Integration's `rateLimits`: the provider's documented limit, which the
 *          managed client keeps to before a call leaves.
 * Boundary: a type only. The client turns it into a token bucket of `requests` refilled over `per`, kept in the
 *           `RateLimitStore` of `@stackra/actions`, one bucket per credential or one for the provider.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rule 13); ADR 0217 (token buckets);
 *                     owner D10 2026-10-28 (stackra-223: `Duration` replaced `Interval`).
 */
import type { Duration } from "@stackra/contracts";

import type { RateLimitScope } from "#core/enums/rate-limit-scope.enum";

/**
 * A provider rate limit.
 *
 * @example
 * const limit: RateLimit = { requests: 10, per: Duration.seconds(1), by: RateLimitScope.Credential };
 */
export interface RateLimit {
  /** How many calls the provider allows per window; a whole number from 1. */
  readonly requests: number;

  /** The window the requests are counted over. */
  readonly per: Duration;

  /** What the limit counts against. */
  readonly by: RateLimitScope;
}
