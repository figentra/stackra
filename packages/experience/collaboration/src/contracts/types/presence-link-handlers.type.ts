/**
 * Stackra file contract:
 * Purpose: `PresenceLinkHandlers`, the callbacks a `PresenceChannel` reports one room membership through: joined, the
 *          other peers changed, the link went down.
 * Boundary: a type only, in the leaf entry. No callback runs before `join` returns. `onPeers` always carries the full
 *           list of the other peers, never this link's own, so a caller replaces rather than merges. `onClose` is not
 *           final: the driver reconnects by itself and calls `onOpen` again; it is never called after `leave`.
 * Runtime: isomorphic
 * Governing contract: ADR 0225 (decisions 1 and 2); ADR 0294 (decision 15).
 */
import type { PresencePeer } from "#contracts/types/presence-peer.type";

/** What a room membership reports. */
export interface PresenceLinkHandlers {
  /** The membership is live. */
  onOpen: () => void;

  /** The other peers in the room, all of them. */
  onPeers: (peers: readonly PresencePeer[]) => void;

  /** The link went down without the caller leaving; the driver reconnects. */
  onClose: () => void;
}
