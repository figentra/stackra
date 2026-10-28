/**
 * Stackra file contract:
 * Purpose: unit tests of `NoneAnalyticsOfflineQueueDriver`: an `AnalyticsOfflineQueue` that keeps nothing.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0263; ADR 0298 (decision 5).
 */
import { describe, expect, it } from "@stackra/testing";

import { AnalyticsOfflineQueue } from "#contracts/ports/analytics-offline-queue.port";
import { NoneAnalyticsOfflineQueueDriver } from "#core/drivers/none-analytics-offline-queue.driver";
import { deliveryNamed } from "#core/drivers/__tests__/offline-delivery.fixture";

describe("NoneAnalyticsOfflineQueueDriver", () => {
  it("keeps nothing", () => {
    const offline = new NoneAnalyticsOfflineQueueDriver();
    expect(offline).toBeInstanceOf(AnalyticsOfflineQueue);
    offline.save([deliveryNamed("lead.submitted")]);
    expect(offline.load()).toEqual([]);
    expect(() => offline.clear()).not.toThrow();
  });
});
