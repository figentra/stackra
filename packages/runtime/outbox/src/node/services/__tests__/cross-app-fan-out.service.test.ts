/**
 * Stackra file contract:
 * Purpose: tests of `CrossAppFanOutService`: one delivery per subscriber that takes the wire name, due now, carrying
 *          the envelope with `envelopeVersion` and without `producer`; none for an event no one takes; a second fan-out
 *          of the same event writes nothing new.
 * Boundary: test only; the memory delivery store and the config subscriber source.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269; ADR 0511 (decisions 12 and 17).
 */
import { describe, expect, it } from "@stackra/testing";

import type { CrossAppConfig } from "#config/cross-app.config";
import type { EventEnvelope } from "#contracts/index";
import { ConfigSubscriberSourceDriver } from "#core/drivers/config-subscriber-source.driver";
import { MemoryDeliveryDriver } from "#core/drivers/memory-delivery.driver";
import { CrossAppFanOutService } from "#node/services/cross-app-fan-out.service";

const NOON = new Date(Date.UTC(2026, 10, 2, 12));

const CAPTURED: EventEnvelope = {
  id: "evt_1",
  type: "payments.payment.captured.v1",
  occurredAt: NOON.toISOString(),
  meta: {},
  data: { paymentId: "pay_1" },
};

/** A fan-out where billing and scheduling take captured payments and usage takes failed ones. */
function fanOutOf() {
  const deliveries = new MemoryDeliveryDriver();
  const config = {
    subscribers: [
      {
        member: "billing",
        inbox: "https://billing.test",
        events: ["payments.payment.captured.v1"],
      },
      { member: "scheduling", inbox: "https://os.test", events: ["payments.payment.captured.v1"] },
      { member: "usage", inbox: "https://usage.test", events: ["payments.payment.failed.v1"] },
    ],
  } as unknown as CrossAppConfig;
  return {
    fanOut: new CrossAppFanOutService(new ConfigSubscriberSourceDriver(config), deliveries),
    deliveries,
  };
}

describe(CrossAppFanOutService, () => {
  // @covers sta-1910:FR-012 @covers sta-1910:FR-004
  it("writes one delivery per subscriber of the wire name, due now, with envelopeVersion and no producer", async () => {
    const { fanOut, deliveries } = fanOutOf();
    await expect(
      fanOut.enqueue({ ...CAPTURED, producer: "forged" } as EventEnvelope, NOON),
    ).resolves.toBe(2);
    const stored = deliveries.stored();
    expect(stored.map((delivery) => delivery.subscriber).sort()).toEqual(["billing", "scheduling"]);
    for (const delivery of stored) {
      expect(delivery.id).toMatch(/^dlv_/);
      expect(delivery.availableAt).toEqual(NOON);
      expect(delivery.envelope).toEqual({ ...CAPTURED, envelopeVersion: 1 });
    }
  });

  it("writes nothing for an event no other app takes, and nothing new for the same event again", async () => {
    const { fanOut, deliveries } = fanOutOf();
    await expect(
      fanOut.enqueue({ ...CAPTURED, type: "payments.refund.created.v1" }, NOON),
    ).resolves.toBe(0);
    expect(deliveries.stored()).toEqual([]);
    await fanOut.enqueue(CAPTURED, NOON);
    await fanOut.enqueue(CAPTURED, NOON);
    expect(deliveries.stored()).toHaveLength(2);
  });
});
