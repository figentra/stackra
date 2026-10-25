/**
 * Stackra file contract:
 * Purpose: `EventEnvelope`, an integration event on the wire: what the relay hands an `EventPublisher` and what the
 *          inbox receives from another service (or from this one, in process).
 * Boundary: a type only, JSON-safe (the time is ISO 8601 text). It maps ADR 0141's envelope: `id`, `type` (the wire
 *           name, which ends in the version), `occurredAt` and `data`; the actor, correlation and causation travel in
 *           `meta` as @stackra/events' `EventMeta` holds them; the scope stands in for 0141's owning organisation
 *           (R-59, ADR 0323). A trace id is the transport's.
 * Runtime: isomorphic
 * Governing contract: ADR 0141 (decision 2: the envelope); ADR 0142 (transport through drivers); ADR 0327.
 */
import type { ScopeRef } from "@stackra/contracts";
import type { EventMeta } from "@stackra/events/contracts";

/** An integration event in transit. */
export interface EventEnvelope {
  /** The event id; a consumer runs each id once (inbox deduplication). */
  readonly id: string;

  /** The wire name, `<module>.<name>.v<version>` (`orders.order.paid.v1`). */
  readonly type: string;

  /** When the fact happened, ISO 8601. */
  readonly occurredAt: string;

  /** The scope it happened in; absent for a platform event. */
  readonly scope?: ScopeRef;

  /** Who caused it and the ids that chain it to its call and cause. */
  readonly meta: Omit<EventMeta, "id" | "occurredAt">;

  /** The event's fields. */
  readonly data: unknown;
}
