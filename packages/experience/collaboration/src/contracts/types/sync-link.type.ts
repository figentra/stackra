/**
 * Stackra file contract:
 * Purpose: `SyncLink`, one open document stream a `SyncTransport` returns: its owner sends document updates through it
 *          and closes it.
 * Boundary: a type only, in the leaf entry. An update is an opaque CRDT update (a Yjs update for a Yjs replica); the
 *           transport never reads it. An update sent while the link is down may be dropped, because the owner sends
 *           its full state again on every open. Closing is idempotent and reports nothing to the handlers.
 * Runtime: isomorphic
 * Governing contract: ADR 0225 (decision 2: Yjs co-editing); ADR 0294 (decision 15).
 */

/** A document stream its caller owns. */
export interface SyncLink {
  /** Sends one update to the other replicas of the document. */
  send(update: Uint8Array): void;

  /** Closes the stream; safe to call more than once. */
  close(): void;
}
