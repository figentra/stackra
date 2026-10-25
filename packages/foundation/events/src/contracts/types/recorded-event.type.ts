/**
 * Stackra file contract:
 * Purpose: `RecordedEvent`, one occurrence of an event: the event instance and its metadata, as the bus queues it and
 *          the outbox stores it.
 * Boundary: a type only, in the leaf entry. The event is typed `object` here because the event bases live in `.`,
 *           which this entry may not import; `.` narrows it to `RecordedEvent<Event>`.
 * Runtime: isomorphic
 * Governing contract: ADR 0141 (decision 3: an in-process event maps one to one at the outbox); ADR 0294 (decision 15).
 */
import type { EventMeta } from "#contracts/types/event-meta.type";

/** An event and the metadata of its occurrence. */
export interface RecordedEvent<E extends object = object> {
  /** The event instance: its payload fields only. */
  readonly event: E;

  /** Its id, time, tenant, actor and causation. */
  readonly meta: EventMeta;
}
