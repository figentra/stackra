/**
 * Stackra file contract:
 * Purpose: `PendingMutation`, one call waiting in the offline queue (`useMutationQueue().items`): its Idempotency-Key,
 *          the versioned action key, the input, the aggregate it is ordered within, and when it was queued and expires.
 * Boundary: a type only, JSON-safe, because the queue persists it (ADR 0059 decision 2). The id is the Idempotency-Key
 *           every replay sends, so a replay after a lost answer is the same call. The versioned key lets a call queued
 *           before an app update replay against the same action major (ADR 0131). Exported from `./react`, where the
 *           pending-changes view names it.
 * Runtime: isomorphic
 * Governing contract: ADR 0059 (decision 2); ADR 0252 (decision 2); ADR 0138 (the idempotency step).
 */
import type { Json } from "@stackra/contracts";

/**
 * A queued call.
 *
 * @example
 * queue.items.map((item) => item.action); // ["orders.order.create@1"]
 */
export interface PendingMutation {
  /** The Idempotency-Key every replay of this call sends. */
  readonly id: string;

  /** The versioned action key (`orders.order.create@1`). */
  readonly action: string;

  /** The call's input, in its wire form. */
  readonly input: Json;

  /** The aggregate it is ordered within: calls of one aggregate replay first in, first out. */
  readonly aggregate: string;

  /** When it was queued (ISO 8601). */
  readonly queuedAt: string;

  /** When it stops being replayed and surfaces as a `stale_offline_mutation` conflict (ISO 8601). */
  readonly expiresAt: string;
}
