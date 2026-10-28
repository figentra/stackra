/**
 * Stackra file contract:
 * Purpose: `CacheMetricEvent`, what a `CacheMetric` observed: a fresh hit, a stale hit, a miss, a load, or an eviction.
 * Boundary: a type only, a closed union; `CountingCacheMetricsDriver` keeps one counter per member.
 * Runtime: isomorphic
 * Governing contract: ADR 0150 (decision 4).
 */

/** What happened: `hit`, `stale` (served past its lifetime), `miss`, `load` (a load ran) or `evict`. */
export type CacheMetricEvent = "hit" | "stale" | "miss" | "load" | "evict";
