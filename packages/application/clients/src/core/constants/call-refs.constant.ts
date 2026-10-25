/**
 * Stackra file contract:
 * Purpose: `CALL_REFS`, every action and query ref this client has loaded, by versioned key, so a queued call that the
 *          mutation queue replays by key finds its route and output schema again.
 * Boundary: filled by `actionRef` and `queryRef` when a generated `#stackra/clients/<service>` module loads; read by
 *           `ClientMutationSenderDriver`. Not exported from an entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0059 (offline queue); ADR 0260 (decision 3).
 */
import type { CallRef } from "#core/types/call-ref.type";

/** Loaded refs by key (`orders.order.create@1`). */
export const CALL_REFS = new Map<string, CallRef>();
