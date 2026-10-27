/**
 * Stackra file contract:
 * Purpose: `RealtimeMessage`, the one frame a session receives: a data-free refresh naming the channel it arrived on,
 *          the wire name of the event that caused it and that occurrence's id.
 * Boundary: a type only, in the leaf entry. It never carries the event's payload: a session that holds the permission
 *           refetches through its own authorised queries (ADR 0225, 2026-10-23 note). The id lets a listener drop a
 *           repeat.
 * Runtime: isomorphic
 * Governing contract: ADR 0225 (notes of 0294 and 2026-10-23); ADR 0141 (wire names); ADR 0294 (decision 15).
 */

/** One data-free refresh. */
export interface RealtimeMessage {
  /** The channel it was broadcast on: `tenant.{scopeId}.<module>` or `principal.{principalId}.<module>`. */
  readonly channel: string;

  /** The wire name of the integration event (`orders.order.paid.v1`). */
  readonly name: string;

  /** The id of the event occurrence. */
  readonly id: string;
}
