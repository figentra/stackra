/**
 * Stackra file contract:
 * Purpose: the `memory` driver of the `AnalyticsOfflineQueue` port: undelivered batches kept in this process, bounded
 *          by `offlineLimit` (the oldest dropped first); for tests and previews.
 * Boundary: in-process state only; two instances never share what they keep.
 * Runtime: isomorphic
 * Governing contract: ADR 0266 (decision 2: memory driver first); ADR 0298 (decision 5).
 */
import { Driver } from "@stackra/container";

import type { AnalyticsConfig } from "#config/analytics.config";
import { AnalyticsOfflineQueue } from "#contracts/ports/analytics-offline-queue.port";
import type { AnalyticsDelivery } from "#contracts/types/analytics-delivery.type";

/**
 * Keeps undelivered batches in memory.
 *
 * @example
 * const offline = new MemoryAnalyticsOfflineQueueDriver(buildConfig(AnalyticsConfig));
 */
export class MemoryAnalyticsOfflineQueueDriver extends Driver(AnalyticsOfflineQueue) {
  private readonly config: AnalyticsConfig;

  private kept: readonly AnalyticsDelivery[] = [];

  /**
   * @param config - how many deliveries are kept (`offlineLimit`).
   */
  constructor(config: AnalyticsConfig) {
    super();
    this.config = config;
  }

  /** What is kept, oldest first. */
  load(): readonly AnalyticsDelivery[] {
    return this.kept;
  }

  /** Keeps the newest `offlineLimit` of `deliveries`. */
  save(deliveries: readonly AnalyticsDelivery[]): void {
    const limit = this.config.offlineLimit;
    this.kept = Object.freeze(limit === 0 ? [] : deliveries.slice(-limit));
  }

  /** Forgets everything kept. */
  clear(): void {
    this.kept = [];
  }
}
