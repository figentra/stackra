/**
 * Stackra file contract:
 * Purpose: the `counting` driver of the `CacheMetrics` port: counters per key owner in this process (hits, stale hits,
 *          misses, loads, load time, evictions), read with `snapshot()`.
 * Boundary: process memory only, never reset by itself; the number of owners is the number of classes keys are made
 *           from, so it stays small. An OTLP exporter reads `snapshot()`; this package ships no vendor SDK.
 * Runtime: isomorphic
 * Governing contract: ADR 0150 (decision 4); ADR 0147 (decision 1); ADR 0294 (decision 4).
 */
import { Driver } from "@stackra/container";

import { CacheMetrics } from "#contracts/ports/cache-metrics.port";
import type { CacheMetric } from "#contracts/types/cache-metric.type";
import type { CacheCounters } from "#core/types/cache-counters.type";

/** Counters of an owner nothing was recorded for yet. */
const ZERO: CacheCounters = Object.freeze({
  hits: 0,
  stale: 0,
  misses: 0,
  loads: 0,
  loadMilliseconds: 0,
  evictions: 0,
});

/**
 * Counts cache observations per owner.
 *
 * @example
 * const product = metrics.snapshot().get("Product");
 * const hitRate = product === undefined ? 0 : product.hits / (product.hits + product.misses);
 */
export class CountingCacheMetricsDriver extends Driver(CacheMetrics) {
  /** Owner to its counters. */
  private readonly counters = new Map<string, CacheCounters>();

  /** Adds `metric` to its owner's counters. */
  record(metric: CacheMetric): void {
    const now = this.counters.get(metric.owner) ?? ZERO;
    switch (metric.event) {
      case "hit": {
        this.counters.set(metric.owner, { ...now, hits: now.hits + metric.value });
        break;
      }
      case "stale": {
        this.counters.set(metric.owner, { ...now, stale: now.stale + metric.value });
        break;
      }
      case "miss": {
        this.counters.set(metric.owner, { ...now, misses: now.misses + metric.value });
        break;
      }
      case "load": {
        this.counters.set(metric.owner, {
          ...now,
          loads: now.loads + 1,
          loadMilliseconds: now.loadMilliseconds + metric.value,
        });
        break;
      }
      case "evict": {
        this.counters.set(metric.owner, { ...now, evictions: now.evictions + metric.value });
        break;
      }
    }
  }

  /** A copy of the counters, by owner. */
  snapshot(): ReadonlyMap<string, CacheCounters> {
    return new Map(this.counters);
  }
}
