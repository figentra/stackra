/**
 * Stackra file contract:
 * Purpose: test fixture: a pending cross-app delivery of `payments.payment.captured.v1`, with any field replaced.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269; ADR 0511 (decision 12).
 */
import type { Delivery } from "#contracts/index";

/** The instant every fixture delivery is written at. */
export const DELIVERY_NOON = new Date(Date.UTC(2026, 10, 6, 12));

/** A pending delivery to billing, with `fields` replaced. */
export function deliveryOf(fields: Partial<Delivery> = {}): Delivery {
  const eventId = fields.eventId ?? "evt_1";
  const type = fields.type ?? "payments.payment.captured.v1";
  return {
    id: "dlv_1",
    eventId,
    subscriber: "billing",
    type,
    envelope: {
      id: eventId,
      type,
      occurredAt: DELIVERY_NOON.toISOString(),
      meta: {},
      data: { paymentId: "pay_1" },
      envelopeVersion: 1,
    },
    attempts: 0,
    availableAt: DELIVERY_NOON,
    createdAt: DELIVERY_NOON,
    ...fields,
  };
}
