/**
 * Stackra file contract:
 * Purpose: unit tests of `recordDelivery`: one `DeliveryRecorded` with an `evt_` id, the clock's time and the delivery
 *          id as correlation; nothing without an outbox.
 * Boundary: test only; the outbox is `OutboxFake`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0141; stackra-207 (STA-1360).
 */
import { Clock } from "@stackra/contracts";
import { OutboxFake } from "@stackra/events/testing";
import { describe, expect, it } from "@stackra/testing";

import { DeliveryRecorded } from "#core/events/delivery-recorded.event";
import { recordDelivery } from "#core/functions/record-delivery.function";

class FixedClock extends Clock {
  now(): Date {
    return new Date("2026-10-27T10:00:00Z");
  }
}

const delivery = {
  deliveryId: "cmd_1",
  channel: "mail",
  provider: "resend",
  status: "sent",
} as const;

describe("recordDelivery", () => {
  it("writes one DeliveryRecorded stamped by the clock", async () => {
    const outbox = new OutboxFake();
    await recordDelivery(outbox, new FixedClock(), delivery);
    const [record, ...rest] = outbox.take();
    expect(rest).toEqual([]);
    expect(record?.event).toBeInstanceOf(DeliveryRecorded);
    expect(record?.event).toMatchObject({ ...delivery, at: "2026-10-27T10:00:00.000Z" });
    expect(record?.meta.id).toMatch(/^evt_[0-9a-hjkmnp-tv-z]{26}$/);
    expect(record?.meta.occurredAt).toEqual(new Date("2026-10-27T10:00:00Z"));
    expect(record?.meta.correlationId).toBe("cmd_1");
  });

  it("records nothing without an outbox", async () => {
    await expect(recordDelivery(undefined, undefined, delivery)).resolves.toBeUndefined();
  });
});
