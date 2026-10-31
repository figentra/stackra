/**
 * Stackra file contract:
 * Purpose: the outbox driver of `@stackra/events`' `ListenerAuditTrail` port (driver name `outbox`): each listener
 *          delivery's entry leaves as the same `AuditEntryRecorded` integration event an action call's entry does, so
 *          the audit service chains and stores both (STA-1715).
 * Boundary: the entry's key is `listener:<ListenerClass>` and its call id the event's id (the correlation, shared by
 *           every listener of the occurrence); the system actor that handled it is the event's actor, and the event's
 *           wire name, and who caused it, go into `fields` beside what the listener added. The event is written in
 *           the delivery's transaction, so it commits with the listener's writes; the relay delivers it at least once.
 * Runtime: isomorphic
 * Governing contract: ADR 0212 (decisions 1, 2 and 4); ADR 0136 (decision 5); ADR 0135 (event ids); STA-1715.
 */
import { Driver } from "@stackra/container";
import { mintPublicId } from "@stackra/contracts";
import { ListenerAuditTrail } from "@stackra/events/contracts";
import type { EventOutbox, ListenerAuditEntry } from "@stackra/events/contracts";

import { AuditEntryRecorded } from "#core/events/audit-entry-recorded.event";

/**
 * Audits listener deliveries through the outbox.
 *
 * @example
 * // generated wiring: { port: ListenerAuditTrail, candidates: { outbox: … }, deps: { outbox: [EventOutbox] } }
 */
export class OutboxListenerAuditTrailDriver extends Driver(ListenerAuditTrail) {
  private readonly outbox: EventOutbox;

  /**
   * @param outbox - where the audit events are written.
   */
  constructor(outbox: EventOutbox) {
    super();
    this.outbox = outbox;
  }

  /** Writes `entry` to the outbox as an audit event. */
  async record(entry: ListenerAuditEntry): Promise<void> {
    const event = AuditEntryRecorded.create({
      callId: entry.eventId,
      key: `listener:${entry.listener}`,
      effects: [],
      actor: entry.actor,
      ...(entry.scopeId === undefined ? {} : { scopeId: entry.scopeId }),
      outcome: "ok",
      fields: {
        ...entry.fields,
        event: entry.event,
        ...(entry.causedBy === undefined
          ? {}
          : { causedBy: { kind: entry.causedBy.kind, id: entry.causedBy.id } }),
      },
    });
    await this.outbox.write([
      {
        event,
        meta: {
          id: mintPublicId("evt"),
          occurredAt: entry.at,
          ...(entry.scopeId === undefined ? {} : { scopeId: entry.scopeId }),
          actor: entry.actor,
          correlationId: entry.eventId,
          causationId: entry.eventId,
        },
      },
    ]);
  }
}
