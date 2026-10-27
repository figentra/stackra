/**
 * Stackra file contract:
 * Purpose: unit tests of `DeliveryRecorded`: an integration event named `delivery.recorded`, version 1, built frozen
 *          from its shipped schema; an unknown status or a non-ISO time is refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0141; stackra-207 (STA-1360).
 */
import { kindOf } from "@stackra/container";
import { describe, expect, it } from "@stackra/testing";
import { schemaOf } from "@stackra/validation";

import { DELIVERY_RECORDED_SCHEMA } from "#core/constants/delivery-recorded-schema.constant";
import { DeliveryRecorded } from "#core/events/delivery-recorded.event";

const values = {
  deliveryId: "cmd_1",
  channel: "sms",
  provider: "twilio",
  status: "sent",
  at: "2026-10-27T10:00:00.000Z",
} as const;

describe("DeliveryRecorded", () => {
  it("is delivery.recorded, version 1, from its shipped schema", () => {
    expect(kindOf(DeliveryRecorded)?.options).toMatchObject({
      name: "delivery.recorded",
      version: 1,
    });
    expect(schemaOf(DeliveryRecorded)).toBe(DELIVERY_RECORDED_SCHEMA);
    const event = DeliveryRecorded.create(values);
    expect(Object.isFrozen(event)).toBe(true);
    expect(event.status).toBe("sent");
  });

  it("refuses an unknown status and a time that is not ISO 8601", () => {
    expect(() => DeliveryRecorded.create({ ...values, status: "opened" as "sent" })).toThrow();
    expect(() => DeliveryRecorded.create({ ...values, at: "yesterday" })).toThrow();
  });
});
