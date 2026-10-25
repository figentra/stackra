/**
 * Stackra file contract:
 * Purpose: `RealtimeBroadcast`, what a `RealtimeDriver` publishes: the data-free message and the permission a session
 *          must hold to receive it.
 * Boundary: a type only, in the leaf entry. The permission is the resolved name (`orders.order.read`); there is no
 *           broadcast without one (ADR 0225, note of 0294).
 * Runtime: isomorphic
 * Governing contract: ADR 0225 (notes of 0294 and 2026-10-23); ADR 0294 (decision 15; amendment item 7).
 */
import type { RealtimeMessage } from "#contracts/types/realtime-message.type";

/** One message and who may receive it. */
export interface RealtimeBroadcast {
  /** The frame each receiving session gets. */
  readonly message: RealtimeMessage;

  /** The permission a session must hold (`orders.order.read`). */
  readonly permission: string;
}
