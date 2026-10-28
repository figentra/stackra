/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryAnalyticsOfflineQueueDriver`: it keeps the newest `offlineLimit` deliveries, loads
 *          them oldest first, keeps nothing with a zero limit, and forgets on clear.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0266 (decision 2); ADR 0298 (decision 5).
 */
import { buildConfig } from "@stackra/config";
import { describe, expect, it } from "@stackra/testing";

import { AnalyticsConfig } from "#config/analytics.config";
import { AnalyticsOfflineQueue } from "#contracts/ports/analytics-offline-queue.port";
import { MemoryAnalyticsOfflineQueueDriver } from "#core/drivers/memory-analytics-offline-queue.driver";
import { deliveryNamed } from "#core/drivers/__tests__/offline-delivery.fixture";

describe("MemoryAnalyticsOfflineQueueDriver", () => {
  it("keeps the newest offlineLimit deliveries, oldest first, and forgets on clear", () => {
    const offline = new MemoryAnalyticsOfflineQueueDriver(
      buildConfig(AnalyticsConfig, { values: { offlineLimit: 2 } }),
    );
    expect(offline).toBeInstanceOf(AnalyticsOfflineQueue);
    offline.save([deliveryNamed("a.one"), deliveryNamed("a.two"), deliveryNamed("a.three")]);
    expect(offline.load().map((delivery) => delivery.name)).toEqual(["a.two", "a.three"]);
    offline.clear();
    expect(offline.load()).toEqual([]);
  });

  it("keeps nothing with a zero limit", () => {
    const offline = new MemoryAnalyticsOfflineQueueDriver(
      buildConfig(AnalyticsConfig, { values: { offlineLimit: 0 } }),
    );
    offline.save([deliveryNamed("a.one")]);
    expect(offline.load()).toEqual([]);
  });
});
