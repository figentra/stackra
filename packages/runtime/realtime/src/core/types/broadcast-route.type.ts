/**
 * Stackra file contract:
 * Purpose: `BroadcastRoute`, how one broadcasting integration event is delivered, as gen writes it from the committed
 *          manifest's event entry: its wire name, its module, the permission a session needs and the audience.
 * Boundary: a type only. The channel is derived from these (`<audience>.{id}.<module>`), never written; the permission
 *           is the resolved name, never the reference object.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (amendment item 7: broadcast audience, default principal); ADR 0225 (2026-10-23
 *                     note); ADR 0141 (wire names).
 */
import type { BroadcastAudience } from "@stackra/events";

/** The broadcast facts of one event. */
export interface BroadcastRoute {
  /** The wire name (`orders.order.paid.v1`). */
  readonly name: string;

  /** The producing module's key (`orders`), the channel's last segment. */
  readonly module: string;

  /** The permission a session must hold (`orders.order.read`). */
  readonly permission: string;

  /** The principal's own sessions, or the tenant's. */
  readonly audience: BroadcastAudience;
}
