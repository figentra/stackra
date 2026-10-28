/**
 * Stackra file contract:
 * Purpose: `CacheMetric`, one observation a `Cache` driver hands the `CacheMetrics` port: a hit, a stale hit, a miss, a
 *          load with its time, or entries evicted by a `forget` or `forgetTag`, each by the owner of the key.
 * Boundary: a type only, plain data. The owner is the key's first part (the model or class name `CacheKey.of` was
 *           given), never the namespace and never a key part, so no scope id or personal data reaches a metric.
 * Runtime: isomorphic
 * Governing contract: ADR 0150 (decision 4); ADR 0147 (decision 1: no vendor SDK in packages).
 */
import type { CacheMetricEvent } from "#contracts/types/cache-metric-event.type";

/**
 * One cache observation.
 *
 * @example
 * metrics.record({ event: "load", owner: "Product", value: 12.5 }); // a load of 12.5 ms
 */
export interface CacheMetric {
  /** What happened. */
  readonly event: CacheMetricEvent;

  /** The key's owner, its first part (`Product` for `CacheKey.of(Product, id)`). */
  readonly owner: string;

  /** Milliseconds for `load`; the number of entries for every other event. */
  readonly value: number;
}
