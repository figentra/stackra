/**
 * Stackra file contract:
 * Purpose: `RateLimitCaps`, the rate-limit numbers one scope's settings set for one API area: the area bucket's refill
 *          (`perMinute`) and size (`burst`), and the per-scope and per-address buckets of an action that declares no
 *          rate limit of its own (`actionPerScope`, `actionPerAddress`).
 * Boundary: a type only, answered by `RateLimitCapSource`. Each number is a cap: the action pipeline takes the lower of
 *           it and the plan's or the configured value, so a cap never raises a limit. `null` caps nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0217 (decision 2: token buckets per area and scope); ADR 0213 (decision 2: the settings
 *                     cascade).
 */

/**
 * One scope's caps for one area; `null` keeps the plan's or the configured value.
 *
 * @example
 * const caps: RateLimitCaps = { perMinute: 30, burst: null, actionPerScope: null, actionPerAddress: 10 };
 */
export interface RateLimitCaps {
  /** The most calls the area bucket refills per minute. */
  readonly perMinute: number | null;

  /** The most calls the area bucket holds at once. */
  readonly burst: number | null;

  /** The most calls per minute one scope makes to an action with no rate limit of its own. */
  readonly actionPerScope: number | null;

  /** The most calls per minute one client address makes to an action with no rate limit of its own. */
  readonly actionPerAddress: number | null;
}
