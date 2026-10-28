/**
 * Stackra file contract:
 * Purpose: `CacheCounters`, the totals `CountingCacheMetricsDriver` keeps for one key owner.
 * Boundary: a type only, plain data, read through `snapshot()` by a devtools panel, a health detail or a test.
 * Runtime: isomorphic
 * Governing contract: ADR 0150 (decision 4).
 */

/**
 * The counters of one owner.
 *
 * @example
 * metrics.snapshot().get("Product"); // { hits: 40, stale: 2, misses: 3, loads: 3, loadMilliseconds: 31, evictions: 4 }
 */
export interface CacheCounters {
  /** Reads served by a fresh entry. */
  readonly hits: number;

  /** Entries served past their lifetime, inside their stale window. */
  readonly stale: number;

  /** Misses: nothing fresh or stale was stored. */
  readonly misses: number;

  /** Loads that ran, failed ones included. */
  readonly loads: number;

  /** The time those loads took, in milliseconds. */
  readonly loadMilliseconds: number;

  /** Entries dropped by `forget` or `forgetTag`. */
  readonly evictions: number;
}
