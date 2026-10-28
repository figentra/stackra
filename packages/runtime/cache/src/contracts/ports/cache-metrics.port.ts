/**
 * Stackra file contract:
 * Purpose: the `CacheMetrics` port: where a `Cache` driver reports hits, stale hits, misses, load times and evictions
 *          per key owner, so TTLs can be tuned and a cache can be shown to help.
 * Boundary: an abstract class that is its own token, keyed `cache.CacheMetrics`; config `cache.metrics` picks the
 *           driver: `none` (the default, records nothing), `counting` (counters per owner in this process, read by
 *           `snapshot()`) or `logger` (one `cache.load` / `cache.evict` debug line each). `record` is synchronous and
 *           must not throw: a metric never changes what the cache answers.
 * Runtime: isomorphic
 * Governing contract: ADR 0150 (decision 4); ADR 0147 (decision 1); ADR 0294 (decisions 4, 15 and 16).
 */
import { Port } from "@stackra/contracts";

import type { CacheMetric } from "#contracts/types/cache-metric.type";

/**
 * Receives cache observations.
 *
 * @example
 * export class CountingCacheMetricsDriver extends Driver(CacheMetrics) {
 *   record(metric: CacheMetric): void { ... }
 * }
 */
export abstract class CacheMetrics extends Port {
  /** Type-only port key, so `DriverName<CacheMetrics>` narrows to this port's drivers. */
  declare readonly "~key": "cache.CacheMetrics";

  /** Takes one observation; never throws. */
  abstract record(metric: CacheMetric): void;
}
