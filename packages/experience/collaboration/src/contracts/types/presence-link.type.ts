/**
 * Stackra file contract:
 * Purpose: `PresenceLink`, one membership of a room that a `PresenceChannel` returns: its owner moves its cursor and
 *          leaves through it.
 * Boundary: a type only, in the leaf entry. A move while the link is down may be dropped (presence is ephemeral; the
 *           next move replaces it). Leaving is idempotent and reports nothing to the handlers.
 * Runtime: isomorphic
 * Governing contract: ADR 0225 (decision 2); ADR 0294 (decision 15).
 */
import type { CollaborationCursor } from "#contracts/types/collaboration-cursor.type";

/** A room membership its caller owns. */
export interface PresenceLink {
  /** Shows this connection's pointer at `cursor`, or hides it with `null`. */
  move(cursor: CollaborationCursor | null): void;

  /** Leaves the room; safe to call more than once. */
  leave(): void;
}
