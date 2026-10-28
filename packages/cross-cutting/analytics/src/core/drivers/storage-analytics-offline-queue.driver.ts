/**
 * Stackra file contract:
 * Purpose: the `storage` driver of the `AnalyticsOfflineQueue` port, a device app's store: undelivered batches are a
 *          JSON list in the `prefs` area of `@stackra/storage` (`analytics.offline`), bounded by `offlineLimit` (the
 *          oldest dropped first).
 * Boundary: reads and writes the area synchronously; the runtime hydrates storage before the first frame. Each stored
 *           item is checked against the delivery schema on load and skipped when it fails, so an edited or older
 *           value never reaches a destination. Written only with deliveries that passed consent (the client's rule).
 * Runtime: isomorphic
 * Governing contract: ADR 0256 (decision 2: the prefs area); ADR 0298 (decision 5); ADR 0294 (decision 17).
 */
import { Driver } from "@stackra/container";
import type { Storage } from "@stackra/storage/contracts";

import type { AnalyticsConfig } from "#config/analytics.config";
import { AnalyticsOfflineQueue } from "#contracts/ports/analytics-offline-queue.port";
import type { AnalyticsDelivery } from "#contracts/types/analytics-delivery.type";
import { ANALYTICS_DELIVERY_SCHEMA } from "#core/constants/analytics-delivery-schema.constant";
import { ANALYTICS_OFFLINE_STORAGE_KEY } from "#core/constants/analytics-offline-storage-key.constant";

/**
 * Keeps undelivered batches in client storage.
 *
 * @example
 * const offline = new StorageAnalyticsOfflineQueueDriver(buildConfig(AnalyticsConfig), fakeStorage());
 */
export class StorageAnalyticsOfflineQueueDriver extends Driver(AnalyticsOfflineQueue) {
  private readonly config: AnalyticsConfig;

  private readonly storage: Storage;

  /**
   * @param config - how many deliveries are kept (`offlineLimit`).
   * @param storage - the client storage whose `prefs` area holds them.
   */
  constructor(config: AnalyticsConfig, storage: Storage) {
    super();
    this.config = config;
    this.storage = storage;
  }

  /** The kept deliveries that still parse, oldest first. */
  load(): readonly AnalyticsDelivery[] {
    const value: unknown = this.storage.prefs.get(ANALYTICS_OFFLINE_STORAGE_KEY);
    if (!Array.isArray(value)) return [];
    const kept: AnalyticsDelivery[] = [];
    for (const item of value) {
      const parsed = ANALYTICS_DELIVERY_SCHEMA.safeParse(item);
      if (parsed.success) kept.push(parsed.data as AnalyticsDelivery);
    }
    return kept;
  }

  /** Keeps the newest `offlineLimit` of `deliveries`; an empty list removes the value. */
  save(deliveries: readonly AnalyticsDelivery[]): void {
    const limit = this.config.offlineLimit;
    const kept = limit === 0 ? [] : deliveries.slice(-limit);
    if (kept.length === 0) this.clear();
    else this.storage.prefs.set(ANALYTICS_OFFLINE_STORAGE_KEY, kept);
  }

  /** Removes everything kept. */
  clear(): void {
    this.storage.prefs.delete(ANALYTICS_OFFLINE_STORAGE_KEY);
  }
}
