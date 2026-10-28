/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./contracts` entry of @stackra/cache, the leaf entry of its ports and the option and metric types they take, until
 *          `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The leaf: it imports no other entry of this package. `Cache` is
 *           exported here only, never from `.` (ADR 0294 decision 15; registry conflict A3).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { Cache } from "#contracts/ports/cache.port";
export { CacheLock } from "#contracts/ports/cache-lock.port";
export { CacheMetrics } from "#contracts/ports/cache-metrics.port";
export { CacheNamespace } from "#contracts/ports/cache-namespace.port";
export { CacheSql } from "#contracts/ports/cache-sql.port";
export type { CacheMetric } from "#contracts/types/cache-metric.type";
export type { CacheMetricEvent } from "#contracts/types/cache-metric-event.type";
export type { CachePutOptions } from "#contracts/types/cache-put-options.type";
export type { CacheRememberOptions } from "#contracts/types/cache-remember-options.type";
