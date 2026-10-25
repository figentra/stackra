/**
 * Stackra file contract:
 * Purpose: `broadcastChannel(route, record)`, the channel one occurrence of a broadcasting event goes out on:
 *          `tenant.{tenantId}.<module>` for the tenant audience, `principal.{principalId}.<module>` for the principal.
 * Boundary: a pure function. The tenant is the occurrence's `meta.tenantId`. The principal is the event's own
 *           `principalId` field when it has one (`InboxMessageCreated`), else the user the call acted for
 *           (`actor.onBehalfOf ?? actor`). A channel it cannot fill throws: a broadcast never falls back to a wider
 *           audience.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (amendment item 7); ADR 0225 (2026-10-23 note); ADR 0098 (decision 7: the subject).
 */
import { ActorKind } from "@stackra/contracts";
import { BroadcastAudience } from "@stackra/events";
import type { RecordedEvent } from "@stackra/events/contracts";

import type { BroadcastRoute } from "#core/types/broadcast-route.type";

/** A channel segment: a public id or a module key, with no dot or whitespace. */
const SEGMENT = /^[A-Za-z0-9_-]+$/;

/** The principal an occurrence is about: its `principalId` field, else the user the call acted for. */
function principalOf({ event, meta }: RecordedEvent): unknown {
  const own = (event as { readonly principalId?: unknown }).principalId;
  if (own !== undefined) return own;
  const subject = meta.actor?.onBehalfOf ?? meta.actor;
  return subject?.kind === ActorKind.User ? subject.id : undefined;
}

/**
 * The channel of `record` under `route`.
 *
 * @throws TypeError when the module key is not a segment, or the tenant or principal is missing or not a segment.
 * @example
 * broadcastChannel({ name: "orders.order.paid.v1", module: "orders", permission: "orders.order.read",
 *   audience: BroadcastAudience.Tenant }, record); // "tenant.ten_01J....orders"
 */
export function broadcastChannel(route: BroadcastRoute, record: RecordedEvent): string {
  if (!SEGMENT.test(route.module))
    throw new TypeError(`"${route.module}" is not a module key for a realtime channel`);
  const id =
    route.audience === BroadcastAudience.Tenant ? record.meta.tenantId : principalOf(record);
  if (typeof id !== "string" || !SEGMENT.test(id))
    throw new TypeError(
      `${route.name} broadcasts to its ${route.audience}, but occurrence ${record.meta.id} names no ${route.audience} id`,
    );
  return `${route.audience}.${id}.${route.module}`;
}
