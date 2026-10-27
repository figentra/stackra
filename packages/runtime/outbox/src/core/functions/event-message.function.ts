/**
 * Stackra file contract:
 * Purpose: `eventMessage`, the outbox message of one recorded integration event: its id and time from the occurrence's
 *          metadata, its wire name, its fields as the payload and the rest of the metadata beside them, due at once.
 * Boundary: internal; the flush writer and the `EventOutbox` driver share it, so both store an event the same way (ADR
 *           0141 decision 3: one-to-one). The event instance is the payload; the store serialises its own fields.
 *           Any `evt_` id passes, so ids stored in the older ULID and random forms keep working (STA-1380).
 * Runtime: isomorphic
 * Governing contract: ADR 0141 (decisions 2 and 3); ADR 0294 (decision 27: metadata travels beside the event);
 *                     ADR 0135 (ids from @stackra/contracts' `mintPublicId`).
 */
import type { AnyClass } from "@stackra/container";
import type { PublicId } from "@stackra/contracts";
import type { Event } from "@stackra/events";
import type { RecordedEvent } from "@stackra/events/contracts";

import { MessageKind } from "#contracts/index";
import type { OutboxMessage } from "#contracts/index";
import { eventName } from "#core/functions/event-name.function";

/**
 * The message of `record`.
 *
 * @throws TypeError when the event is not an integration event, or its id is not an `evt_` id.
 * @example
 * eventMessage({ event: OrderPaid.create({ orderId }), meta: { id: mintPublicId("evt"), occurredAt } });
 */
export function eventMessage(record: RecordedEvent): OutboxMessage {
  const { id, occurredAt, ...meta } = record.meta;
  if (!id.startsWith("evt_")) throw new TypeError(`An outbox event id starts with evt_, got ${id}`);
  return Object.freeze({
    id: id as PublicId<"evt">,
    kind: MessageKind.Event,
    type: eventName(record.event.constructor as AnyClass<Event>),
    data: record.event,
    meta: Object.freeze(meta),
    occurredAt,
    attempts: 0,
    availableAt: occurredAt,
  });
}
