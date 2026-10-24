/**
 * Stackra file contract:
 * Purpose: `usePresence(room)`, the hook a component shows who else is in a room with: it holds the room while
 *          mounted and returns its state (status and other peers), re-rendering on each change.
 * Boundary: reads the `CollaborationSession` of the nearest container through `useSyncExternalStore`; joins in an
 *           effect, so a server render joins nothing and reads `null`. A room refused by the plan throws its error
 *           (`EntitlementRequiredError`) during render, so the nearest error boundary shows the upgrade path. The
 *           room is keyed by its document: a new object for the same document does not rejoin.
 * Runtime: isomorphic
 * Governing contract: ADR 0225 (decision 2); ADR 0270 (decisions 5 and 6); ADR 0294 (decision 17).
 */
import { useContainer } from "@stackra/container/react";
import type { PublicId } from "@stackra/contracts";
import { useEffect, useEffectEvent, useSyncExternalStore } from "react";

import type { CollaborationRoom } from "#contracts/index";
import { CollaborationSession } from "#core/index";
import type { CollaborationRoomState } from "#core/index";

/**
 * `room`'s state while the component is mounted; `null` until the first join.
 *
 * @throws the room's error (`EntitlementRequiredError`) when the plan refuses live collaboration.
 * @throws Error outside a `ContainerProvider`, or when the container does not bind `CollaborationSession`.
 * @example
 * const presence = usePresence({ document: page.id, scope });
 * return <Avatars principals={presence?.peers.map((peer) => peer.principalId) ?? []} />;
 */
export function usePresence(room: CollaborationRoom): CollaborationRoomState | null {
  const session = useContainer().get(CollaborationSession);
  const { document } = room;
  const join = useEffectEvent((key: PublicId) => session.join({ ...room, document: key }));
  useEffect(() => join(document), [document]);
  const read = (): CollaborationRoomState | null => session.state({ document });
  const state = useSyncExternalStore(session.subscribe, read, read);
  if (state?.error !== undefined) throw state.error;
  return state;
}
