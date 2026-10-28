/**
 * Stackra file contract:
 * Purpose: the `logger` driver of the `CacheMetrics` port: one `cache.load` debug line per load (owner and
 *          milliseconds) and one `cache.evict` line per eviction (owner and count), through the `Logger` port.
 * Boundary: hits, stale hits and misses are not logged (too many lines); select `counting` for rates. A line carries the
 *           owner and a number only, never a key part, a namespace or a value.
 * Runtime: isomorphic
 * Governing contract: ADR 0150 (decision 4); ADR 0294 (decisions 4 and 16).
 */
import { Driver } from "@stackra/container";
import type { Logger } from "@stackra/contracts";

import { CacheMetrics } from "#contracts/ports/cache-metrics.port";
import type { CacheMetric } from "#contracts/types/cache-metric.type";

/**
 * Logs cache loads and evictions.
 *
 * @example
 * // runway.yaml (dev): config.cache: { metrics: logger }
 * // debug cache.load { owner: "Product", milliseconds: 12 }
 */
export class LoggerCacheMetricsDriver extends Driver(CacheMetrics) {
  private readonly logger: Logger;

  /**
   * @param logger - where the lines go.
   */
  constructor(logger: Logger) {
    super();
    this.logger = logger;
  }

  /** Logs a load or an eviction; drops every other observation. */
  record(metric: CacheMetric): void {
    if (metric.event === "load")
      this.logger.debug("cache.load", { owner: metric.owner, milliseconds: metric.value });
    else if (metric.event === "evict")
      this.logger.debug("cache.evict", { owner: metric.owner, count: metric.value });
  }
}
