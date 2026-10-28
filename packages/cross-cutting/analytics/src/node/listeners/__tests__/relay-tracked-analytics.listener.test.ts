/**
 * Stackra file contract:
 * Purpose: unit tests of `RelayTrackedAnalyticsListener`: an `analytics.tracked` event becomes one track delivery with
 *          its ids, the call id as session, the locale in the context and the denied properties removed; an anonymous
 *          event carries no user id; a driver's rejection passes on, so the outbox relay retries.
 * Boundary: test only; the destination is the memory driver.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269; ADR 0216 (decision 1); STA-1512.
 */
import { AnalyticsTracked } from "@stackra/actions";
import { buildConfig } from "@stackra/config";
import type { ListenerContext } from "@stackra/events";
import { describe, expect, it } from "@stackra/testing";

import { AnalyticsConfig } from "#config/analytics.config";
import type { AnalyticsDriver } from "#contracts/ports/analytics-driver.port";
import { MemoryAnalyticsDriver } from "#core/drivers/memory-analytics.driver";
import { RelayTrackedAnalyticsListener } from "#node/listeners/relay-tracked-analytics.listener";

const CTX = {} as ListenerContext;

/** The event the pipeline writes, with `overrides`. */
function tracked(overrides: Partial<Record<string, unknown>> = {}): AnalyticsTracked {
  return AnalyticsTracked.create({
    eventId: "evt_01jb0000000000000000000001",
    name: "lead.submitted",
    properties: { leadId: "led_1", plan: "pro" },
    occurredAt: "2026-10-28T10:00:00.000Z",
    anonymousId: "anon_1",
    userId: "usr_1",
    callId: "call_1",
    key: "crm.lead.submit@1",
    locale: "ar-SA",
    ...overrides,
  } as never);
}

/** The listener over the memory driver, denying `plan`. */
function relay(driver: AnalyticsDriver = new MemoryAnalyticsDriver()) {
  const config = buildConfig(AnalyticsConfig, { values: { denyProperties: ["plan"] } });
  return new RelayTrackedAnalyticsListener(driver, config);
}

describe(RelayTrackedAnalyticsListener, () => {
  it("sends one track delivery with the event's ids and no denied property", async () => {
    const driver = new MemoryAnalyticsDriver();
    await relay(driver).handle(tracked(), CTX);
    expect(driver.delivered()).toEqual([
      {
        eventId: "evt_01jb0000000000000000000001",
        kind: "track",
        name: "lead.submitted",
        properties: { leadId: "led_1" },
        occurredAt: "2026-10-28T10:00:00.000Z",
        anonymousId: "anon_1",
        userId: "usr_1",
        sessionId: "call_1",
        context: { library: { name: "@stackra/actions" }, locale: "ar-SA" },
      },
    ]);
  });

  it("sends no user id for an anonymous visitor", async () => {
    const driver = new MemoryAnalyticsDriver();
    await relay(driver).handle(tracked({ userId: undefined }), CTX);
    expect(driver.delivered()[0]).not.toHaveProperty("userId");
  });

  it("passes a driver's rejection on, so the relay retries", async () => {
    class DownDriver extends MemoryAnalyticsDriver {
      override send(): Promise<void> {
        return Promise.reject(new Error("destination down"));
      }
    }
    await expect(relay(new DownDriver()).handle(tracked(), CTX)).rejects.toThrow(
      "destination down",
    );
  });
});
