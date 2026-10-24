/**
 * Stackra file contract:
 * Purpose: `CollaborationRoomState`, what a joined room looks like to its client: the presence link's status, the
 *          other peers, and why the room could not be joined when it could not.
 * Boundary: a type only. The status reuses realtime's `RealtimeStatus`, so one connection indicator renders both. A
 *           refused room is `disconnected` with no peers and an `error` (`EntitlementRequiredError` when the plan
 *           lacks live collaboration); it stays so until every holder leaves.
 * Runtime: isomorphic
 * Governing contract: ADR 0225 (decisions 1 and 2); ADR 0270 (decision 5).
 */
import type { RealtimeStatus } from "@stackra/realtime";

import type { PresencePeer } from "#contracts/types/presence-peer.type";

/** One room's client-side state. */
export interface CollaborationRoomState {
  /** `connecting` until the presence link opens, `connected` while it is up, `disconnected` while it is down. */
  readonly status: RealtimeStatus;

  /** The other peers in the room; empty while the link is down. */
  readonly peers: readonly PresencePeer[];

  /** Why the room could not be joined; absent while it could. */
  readonly error?: unknown;
}
