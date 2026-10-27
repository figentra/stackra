/**
 * Stackra file contract:
 * Purpose: `recordDelivery`, how a transport records a delivery outcome: one `DeliveryRecorded` event written to the
 *          service's `EventOutbox`, stamped with the clock's time and a fresh `evt_` id, correlated by the delivery id.
 * Boundary: internal; called by the transports after the send log. Without an outbox it records nothing, so a host that
 *           binds none keeps the old behaviour. The write joins the caller's unit of work when there is one.
 * Runtime: isomorphic
 * Governing contract: ADR 0223; ADR 0086 (decision 1); ADR 0141 (decision 2: the envelope); stackra-207 (STA-1360).
 */
import type { Clock } from "@stackra/contracts";
import type { EventOutbox } from "@stackra/events/contracts";

import type { NotificationDeliveryEvent } from "#contracts/types/notification-delivery-event.type";
import { DeliveryRecorded } from "#core/events/delivery-recorded.event";

/** Crockford base32: no I, L, O or U (the outbox refuses an event id without `evt_`). */
const ALPHABET = "0123456789abcdefghjkmnpqrstvwxyz";

/**
 * Writes `delivery` as a `DeliveryRecorded` event, when there is an outbox.
 *
 * @example
 * await recordDelivery(this.outbox, this.clock, { deliveryId: key, channel: "sms", provider, status: "sent" });
 */
export async function recordDelivery(
  outbox: EventOutbox | undefined,
  clock: Clock | undefined,
  delivery: Omit<NotificationDeliveryEvent, "at">,
): Promise<void> {
  if (outbox === undefined) return;
  const now = clock?.now() ?? new Date();
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(26));
  await outbox.write([
    {
      event: DeliveryRecorded.create({ ...delivery, at: now.toISOString() }),
      meta: {
        // 256 is a multiple of 32, so `% 32` keeps every character equally likely.
        id: `evt_${Array.from(bytes, (byte) => ALPHABET[byte % 32]).join("")}`,
        occurredAt: now,
        correlationId: delivery.deliveryId,
      },
    },
  ]);
}
