/**
 * Stackra file contract:
 * Purpose: `ConflictRecord`, a queued call the server refused for good or that outlived its retention
 *          (`useMutationQueue().conflicts`): the local intent (the call itself), the refusal code and the server's
 *          current record, which the UI shows and resolves.
 * Boundary: a type only, JSON-safe and persisted with the queue. A conflict is never resolved silently: it stays until
 *           a person picks a resolution or discards it, and the calls queued after it on the same aggregate wait
 *           behind it. Exported from `./react`, where the pending-changes view names it.
 * Runtime: isomorphic
 * Governing contract: ADR 0059 (decision 3: a `409` is a conflict record); ADR 0252; ADR 0268 (R16: the UI resolves
 *                     it).
 */
import type { Json } from "@stackra/contracts";

import type { PendingMutation } from "#core/types/pending-mutation.type";

/**
 * A queued call that needs a person.
 *
 * @example
 * queue.resolve(conflict.id, ConflictResolution.ServerWins);
 */
export interface ConflictRecord extends PendingMutation {
  /** Why it stopped: the refusal code (`version_conflict`, `forbidden`) or `stale_offline_mutation`. */
  readonly code: string;

  /** The server's current record from a `409`'s details; `null` when the server sent none. */
  readonly server: Json | null;

  /** When it became a conflict (ISO 8601). */
  readonly conflictedAt: string;
}
