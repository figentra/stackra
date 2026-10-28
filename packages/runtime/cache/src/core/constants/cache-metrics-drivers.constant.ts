/**
 * Stackra file contract:
 * Purpose: `CACHE_METRICS_DRIVERS`, the driver names config `cache.metrics` may select for the `CacheMetrics` port:
 *          `none` (the default), `counting` and `logger`, each its driver file's prefix.
 * Boundary: the stand-in for the names gen derives from the driver files; the shipped schema's `metrics` enum and the
 *           `DriverRegistry` entry are both read from it. Internal to this package.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 4); ADR 0150 (decision 4); STA-1435.
 */

/** The `CacheMetrics` drivers of this package, by name. */
export const CACHE_METRICS_DRIVERS = ["none", "counting", "logger"] as const;
