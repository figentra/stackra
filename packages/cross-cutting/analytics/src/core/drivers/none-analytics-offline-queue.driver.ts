/**
 * Stackra file contract:
 * Purpose: the `none` driver of the `AnalyticsOfflineQueue` port, the default: nothing is kept, so a batch the engine
 *          could not deliver is dropped, as before the delivery engine.
 * Boundary: stateless; `load` is always empty.
 * Runtime: isomorphic
 * Governing contract: ADR 0263 (a driver is named by its class: `none`); ADR 0298 (decision 5).
 */
import { Driver } from "@stackra/container";

import { AnalyticsOfflineQueue } from "#contracts/ports/analytics-offline-queue.port";
import type { AnalyticsDelivery } from "#contracts/types/analytics-delivery.type";

/**
 * Keeps no undelivered batch, so each one is dropped.
 *
 * @example
 * new NoneAnalyticsOfflineQueueDriver().load(); // []
 */
export class NoneAnalyticsOfflineQueueDriver extends Driver(AnalyticsOfflineQueue) {
  /** Nothing is kept. */
  load(): readonly AnalyticsDelivery[] {
    return [];
  }

  /** Drops `deliveries` without keeping them. */
  save(_deliveries: readonly AnalyticsDelivery[]): void {
    // Nothing is kept by design.
  }

  /** Nothing to remove. */
  clear(): void {
    // Nothing is kept by design.
  }
}
