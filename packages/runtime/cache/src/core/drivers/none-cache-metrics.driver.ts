/**
 * Stackra file contract:
 * Purpose: the `none` driver of the `CacheMetrics` port, the default: it records nothing.
 * Boundary: no state, no output; costs one call per observation.
 * Runtime: isomorphic
 * Governing contract: ADR 0150 (decision 4); ADR 0294 (decision 4).
 */
import { Driver } from "@stackra/container";

import { CacheMetrics } from "#contracts/ports/cache-metrics.port";
import type { CacheMetric } from "#contracts/types/cache-metric.type";

/** Drops every observation. */
export class NoneCacheMetricsDriver extends Driver(CacheMetrics) {
  /** Does nothing. */
  record(_metric: CacheMetric): void {
    // Intentionally empty: the default records no metric.
  }
}
