/**
 * Stackra file contract:
 * Purpose: `ListenerAuditEntry`, what the bus hands the `ListenerAuditTrail` port after a listener handled an event:
 *          the listener, the event and its id, who handled it and who caused it, when, and the fields the listener
 *          added with `ctx.audit(...)`.
 * Boundary: a type only. Written for a delivery that ended; a listener that threw is not audited (it reached no
 *           outcome), as an action that failed with a bug is not. A classified value never belongs in `fields`.
 * Runtime: isomorphic
 * Governing contract: ADR 0136 (decision 5: every action is audited; listeners the same way, STA-1715); ADR 0078.
 */
import type { Actor, Json } from "@stackra/contracts";

/** One audited listener delivery. */
export interface ListenerAuditEntry {
  /** The listener class's name (`IssueDeviceCredentialListener`). */
  readonly listener: string;

  /** The event's wire name (`devices.device.paired.v1`), else its class name for a domain event. */
  readonly event: string;

  /** The event's id: the entry's correlation, shared by every listener of the occurrence. */
  readonly eventId: string;

  /** The system actor that handled the event. */
  readonly actor: Actor;

  /** Who caused the event, when its metadata says. */
  readonly causedBy?: Actor;

  /** The tenant the event belongs to; absent for a platform event. */
  readonly scopeId?: string;

  /** When the delivery ran, from the Clock port. */
  readonly at: Date;

  /** The fields the listener added with `ctx.audit(...)`, merged in call order. */
  readonly fields: Readonly<Record<string, Json>>;
}
