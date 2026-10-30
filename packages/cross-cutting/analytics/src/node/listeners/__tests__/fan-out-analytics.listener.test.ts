/**
 * Stackra file contract:
 * Purpose: unit tests of `FanOutAnalyticsListener` (STA-1624): `default` goes to the bound driver, a named destination
 *          to its instance from the lookup and to no other, a driver's rejection propagates (the outbox retries that
 *          destination alone), and an unknown destination rejects.
 * Boundary: test only; memory drivers, no network.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0483 (decision 4).
 */
import type { ListenerContext } from "@stackra/events";
import { describe, expect, it } from "@stackra/testing";

import type { AnalyticsDriver } from "#contracts/ports/analytics-driver.port";
import { AnalyticsDriverLookup } from "#contracts/ports/analytics-driver-lookup.port";
import { MemoryAnalyticsDriver } from "#core/drivers/memory-analytics.driver";
import { AnalyticsBatchAccepted } from "#node/events/analytics-batch-accepted.event";
import { FanOutAnalyticsListener } from "#node/listeners/fan-out-analytics.listener";

const CTX = {} as ListenerContext;

const DELIVERY = {
  eventId: "evt_1",
  name: "purchase",
  properties: {},
  occurredAt: "2026-10-30T09:00:00.000Z",
  anonymousId: "anon_1",
  sessionId: "ses_1",
  context: { library: { name: "@stackra/analytics" } },
};

/** A lookup that knows `instances`. */
function lookupOf(instances: Record<string, AnalyticsDriver>): AnalyticsDriverLookup {
  return new (class extends AnalyticsDriverLookup {
    driver(name: string): AnalyticsDriver | undefined {
      return instances[name];
    }
  })();
}

/** The event for `destination`. */
const accepted = (destination: string) =>
  AnalyticsBatchAccepted.create({ destination, snapshotId: "csn_1", deliveries: [DELIVERY] });

describe(FanOutAnalyticsListener, () => {
  // @covers sta-1624:FR-005
  it("sends each destination's batch to its own driver only", async () => {
    const primary = new MemoryAnalyticsDriver();
    const ga4 = new MemoryAnalyticsDriver();
    const listener = new FanOutAnalyticsListener(primary, lookupOf({ ga4 }));
    await listener.handle(accepted("default"), CTX);
    await listener.handle(accepted("ga4"), CTX);
    expect(primary.delivered().map((item) => item.eventId)).toEqual(["evt_1"]);
    expect(ga4.delivered().map((item) => item.eventId)).toEqual(["evt_1"]);
  });

  it("propagates a driver's rejection so the outbox retries that destination", async () => {
    const failing = new (class extends MemoryAnalyticsDriver {
      override send(): Promise<void> {
        return Promise.reject(new Error("down"));
      }
    })();
    await expect(
      new FanOutAnalyticsListener(failing, lookupOf({})).handle(accepted("default"), CTX),
    ).rejects.toThrow("down");
  });

  it("rejects a destination no driver instance answers to", async () => {
    const listener = new FanOutAnalyticsListener(new MemoryAnalyticsDriver(), lookupOf({}));
    await expect(listener.handle(accepted("ga4"), CTX)).rejects.toThrow(RangeError);
  });
});
