/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./react` entry of @stackra/query (`useMutationQueue` and the queue's record types,
 *          `PendingMutation` and `ConflictRecord`) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The record types are declared beside the queue in `core` and
 *           exported from here only, where the views that list them import them. The query hooks of the generated
 *           client are `@stackra/clients/react`'s, not this package's.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; registry N4 (hooks in clients).
 */
export type { ConflictRecord } from "#core/types/conflict-record.type";
export type { PendingMutation } from "#core/types/pending-mutation.type";
export { useMutationQueue } from "#react/mutation-queue/use-mutation-queue";
