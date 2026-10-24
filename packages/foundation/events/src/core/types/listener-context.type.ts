/**
 * Stackra file contract:
 * Purpose: `ListenerContext`, the second parameter of a listener's `handle`: the occurrence it reacts to (id, time,
 *          tenant, actor, causation, connection) and the clock.
 * Boundary: a type only; the bus builds it per delivery from the event's metadata. `eventId` is what a listener keys
 *           its idempotency on; `now()` reads the Clock port, so a test freezes it.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 16: `handle(event, ctx)`); ADR 0078 (decision 4); ADR 0308 (rule 16:
 *                     `ctx.connection`).
 */
import type { Actor } from "@stackra/contracts";

/** What a listener knows about the event it handles. */
export interface ListenerContext {
  /** The event's id; a listener runs once per id. */
  readonly eventId: string;

  /** When the fact happened. */
  readonly occurredAt: Date;

  /** The tenant the event belongs to; absent for a platform event. */
  readonly tenantId?: string;

  /** Who caused the event. */
  readonly actor?: Actor;

  /** The id shared by the unit of work that recorded it. */
  readonly correlationId?: string;

  /** The id of the event that caused it. */
  readonly causationId?: string;

  /** The connection a webhook event arrived on; absent for the platform's own account. */
  readonly connection?: string;

  /** The current instant, from the Clock port. */
  now(): Date;
}
