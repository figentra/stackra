/**
 * Stackra file contract:
 * Purpose: unit tests of `StorageAnalyticsOfflineQueueDriver`: it keeps the newest `offlineLimit` deliveries under
 *          `analytics.offline` in the `prefs` area, loads only the items that still parse, removes the value on an
 *          empty save or a clear, and reads a non-list value as nothing kept.
 * Boundary: test only; the storage is @stackra/storage's in-memory fake.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0256 (decision 2); ADR 0298 (decision 5).
 */
import { buildConfig } from "@stackra/config";
import { fakeStorage } from "@stackra/storage/testing";
import { describe, expect, it } from "@stackra/testing";

import { AnalyticsConfig } from "#config/analytics.config";
import { AnalyticsOfflineQueue } from "#contracts/ports/analytics-offline-queue.port";
import { StorageAnalyticsOfflineQueueDriver } from "#core/drivers/storage-analytics-offline-queue.driver";
import { deliveryNamed } from "#core/drivers/__tests__/offline-delivery.fixture";

describe("StorageAnalyticsOfflineQueueDriver", () => {
  it("keeps the newest offlineLimit deliveries in prefs and loads them back", () => {
    const storage = fakeStorage();
    const offline = new StorageAnalyticsOfflineQueueDriver(
      buildConfig(AnalyticsConfig, { values: { offlineLimit: 2 } }),
      storage,
    );
    expect(offline).toBeInstanceOf(AnalyticsOfflineQueue);
    offline.save([deliveryNamed("a.one"), deliveryNamed("a.two"), deliveryNamed("a.three")]);
    expect(offline.load()).toEqual([deliveryNamed("a.two"), deliveryNamed("a.three")]);
    expect(storage.prefs.get("analytics.offline")).toHaveLength(2);
  });

  it("skips items that no longer parse and reads a non-list as nothing", () => {
    const storage = fakeStorage();
    const offline = new StorageAnalyticsOfflineQueueDriver(buildConfig(AnalyticsConfig), storage);
    storage.prefs.set("analytics.offline", [deliveryNamed("a.one"), { name: "broken" }]);
    expect(offline.load().map((delivery) => delivery.name)).toEqual(["a.one"]);
    storage.prefs.set("analytics.offline", "not a list");
    expect(offline.load()).toEqual([]);
  });

  it("removes the value on an empty save and on clear", () => {
    const storage = fakeStorage();
    const offline = new StorageAnalyticsOfflineQueueDriver(buildConfig(AnalyticsConfig), storage);
    offline.save([deliveryNamed("a.one")]);
    offline.save([]);
    expect(storage.prefs.get("analytics.offline")).toBeUndefined();
    offline.save([deliveryNamed("a.one")]);
    offline.clear();
    expect(offline.load()).toEqual([]);
  });
});
