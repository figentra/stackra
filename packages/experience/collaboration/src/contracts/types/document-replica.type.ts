/**
 * Stackra file contract:
 * Purpose: `DocumentReplica`, the CRDT seam: what the session and the snapshot service need from a local copy of a
 *          shared document, so neither imports Yjs. `./react` adapts a `Y.Doc` to it.
 * Boundary: a type only, in the leaf entry. `apply` merges a remote update or a snapshot and must not report it back
 *           through `onUpdate`, which reports local changes only; that is what keeps updates from echoing. Applying
 *           the same update twice changes nothing (a CRDT merge).
 * Runtime: isomorphic
 * Governing contract: ADR 0225 (decision 2: Yjs, a CRDT); ADR 0270 (decision 5); the not-built-yet rule (Yjs for
 *                     shared documents only, no sync engine).
 */

/** A local copy of a shared document. */
export interface DocumentReplica {
  /** Merges an update from another replica or a snapshot's state. */
  apply(update: Uint8Array): void;

  /** The full state, for a snapshot and the first message on every open stream. */
  encode(): Uint8Array;

  /**
   * Calls `listener` with each local change as an update.
   *
   * @returns removes the listener.
   */
  onUpdate(listener: (update: Uint8Array) => void): () => void;
}
