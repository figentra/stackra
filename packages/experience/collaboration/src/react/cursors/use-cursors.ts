/**
 * Stackra file contract:
 * Purpose: `useCursors(room)`, the hook a canvas or grid surface draws the other peers' pointers with and reports its
 *          own: it returns the peers whose cursor is on the surface and a function that moves this client's cursor.
 * Boundary: holds the room through `usePresence`, so it throws the same refusal and reads `null` presence on the
 *           server. Moves are throttled by the session to `cursorIntervalMilliseconds`; the move function is stable
 *           for a document.
 * Runtime: isomorphic
 * Governing contract: ADR 0225 (decision 2: cursors); ADR 0270 (decision 6: cursors for full collaboration).
 */
import { useContainer } from "@stackra/container/react";
import { useCallback, useMemo } from "react";

import type { CollaborationCursor, CollaborationRoom, PresencePeer } from "#contracts/index";
import { CollaborationSession } from "#core/index";
import { usePresence } from "#react/presence/use-presence";

/** No peers, shared so an empty room keeps one identity across renders. */
const NO_PEERS: readonly PresencePeer[] = [];

/**
 * The other peers' cursors in `room` and the mover of this client's.
 *
 * @throws as `usePresence`.
 * @example
 * const [cursors, moveCursor] = useCursors(room);
 * <Canvas onPointerMove={(event) => moveCursor(toSurface(event))} onPointerLeave={() => moveCursor(null)} />
 */
export function useCursors(
  room: CollaborationRoom,
): readonly [readonly PresencePeer[], (cursor: CollaborationCursor | null) => void] {
  const session = useContainer().get(CollaborationSession);
  const peers = usePresence(room)?.peers ?? NO_PEERS;
  const { document } = room;
  const cursors = useMemo(() => peers.filter((peer) => peer.cursor !== null), [peers]);
  const move = useCallback(
    (cursor: CollaborationCursor | null) => session.moveCursor({ document }, cursor),
    [session, document],
  );
  return [cursors, move];
}
