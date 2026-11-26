/**
 * Stackra file contract:
 * Purpose: `ListenerContext`, the second parameter of a listener's `handle`: the occurrence it reacts to (id, time,
 *          tenant, actor, causation, connection), the service that published it as its transport verified it
 *          (`producer`), the clock and `audit`, the fields the delivery's audit entry carries.
 * Boundary: a type only; the bus builds it per delivery from the event's metadata. `eventId` is what a listener keys
 *           its idempotency on; `now()` reads the Clock port, so a test freezes it. `producer` is never read from the
 *           metadata or the event's fields: only `EventBus.deliver`'s own argument sets it (STA-1792).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 16: `handle(event, ctx)`); ADR 0078 (decision 4); ADR 0308 (rule 16:
 *                     `ctx.connection`); ADR 0509 (decision 7: act only on the store's envelopes); ADR 0511
 *                     (decision 11: the verified producer).
 */
import type { Actor, Json } from "@stackra/contracts";

/** What a listener knows about the event it handles. */
export interface ListenerContext {
  /** The event's id; a listener runs once per id. */
  readonly eventId: string;

  /** When the fact happened. */
  readonly occurredAt: Date;

  /** The tenant the event belongs to; absent for a platform event. */
  readonly scopeId?: string;

  /** Who caused the event. */
  readonly actor?: Actor;

  /** The id shared by the unit of work that recorded it. */
  readonly correlationId?: string;

  /** The id of the event that caused it. */
  readonly causationId?: string;

  /** The connection a webhook event arrived on; absent for the platform's own account. */
  readonly connection?: string;

  /**
   * The service that published the event, as the transport that carried it verified it: the topic's owner when the
   * publishing relay's stamp names it too, the cross-app sender whose key signed it, or this service for its own
   * in-process relay. Absent for an event dispatched in process, or one whose transport proves no producer. Never taken from the event or its metadata, so
   * a listener that must act only on one service's events checks this, never `actor`.
   */
  readonly producer?: string;

  /** The current instant, from the Clock port. */
  now: () => Date;

  /**
   * Adds `fields` to this delivery's audit entry (STA-1715), as `ctx.audit` does for an action call: what was issued or
   * changed, by its public id. Never a secret, a credential or another classified value.
   */
  audit: (fields: Readonly<Record<string, Json>>) => void;
}
