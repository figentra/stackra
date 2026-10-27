/**
 * Stackra file contract:
 * Purpose: the outbox driver of the `AuditTrail` port (driver name `outbox`): each audit entry leaves as one
 *          `AuditEntryRecorded` integration event through the `EventOutbox`, for the audit service to chain and store.
 * Boundary: no store of its own: evidence goes to the outbox (ADR 0212 decision 4) and the relay delivers it at least
 *           once, so the audit service deduplicates by the event id. The event carries the call's tenant and actor in
 *           its metadata as every event does, and the request origin as `originKind` and `originId` (ADR 0456). The pipeline writes the entry after the action's unit of work ends, so a
 *           refused call is audited even though its changes rolled back.
 * Runtime: isomorphic
 * Governing contract: ADR 0212 (decisions 1, 2 and 4); ADR 0098 (decisions 3 and 7); ADR 0294 (decision 16).
 */
import { Driver } from "@stackra/container";
import type { EventOutbox } from "@stackra/events/contracts";

import { AuditTrail } from "#contracts/ports/audit-trail.port";
import type { AuditEntry } from "#contracts/types/audit-entry.type";
import { AuditEntryRecorded } from "#core/events/audit-entry-recorded.event";
import { mintEventId } from "#core/functions/mint-event-id.function";

/**
 * Audits through the outbox.
 *
 * @example
 * // generated wiring: { port: AuditTrail, candidates: { outbox: … }, deps: { outbox: [EventOutbox] } }
 */
export class OutboxAuditTrailDriver extends Driver(AuditTrail) {
  private readonly outbox: EventOutbox;

  /**
   * @param outbox - where the audit events are written.
   */
  constructor(outbox: EventOutbox) {
    super();
    this.outbox = outbox;
  }

  /** Writes `entry` to the outbox as an audit event. */
  async record(entry: AuditEntry): Promise<void> {
    const { call } = entry;
    const event = AuditEntryRecorded.create({
      callId: call.callId,
      key: call.key,
      ...(call.permission === undefined ? {} : { permission: call.permission }),
      ...(call.risk === undefined ? {} : { risk: call.risk }),
      effects: [...(call.effects ?? [])],
      actor: call.actor,
      ...(call.scope === undefined ? {} : { scopeId: call.scope.id, scopePath: call.scope.path }),
      ...(call.origin === undefined ? {} : { originKind: call.origin.kind }),
      ...(call.origin?.id === undefined ? {} : { originId: call.origin.id }),
      outcome: entry.outcome,
      ...(entry.code === undefined ? {} : { code: entry.code }),
      fields: { ...entry.fields },
    });
    await this.outbox.write([
      {
        event,
        meta: {
          id: mintEventId(),
          occurredAt: entry.at,
          ...(call.scopeId === undefined ? {} : { scopeId: call.scopeId }),
          actor: call.actor,
          correlationId: call.callId,
        },
      },
    ]);
  }
}
