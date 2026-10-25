/**
 * Stackra file contract:
 * Purpose: `useSharedDocument(room)`, the hook a full-collaboration editor (pages, screens, app shells, posts and
 *          articles) gets its `Y.Doc` from: restored from the latest snapshot, co-edited through the room's sync
 *          stream while the plan grants live collaboration, and saved as snapshots while it changes locally.
 * Boundary: one `Y.Doc` per document (its `guid` is the document's public id). The binding and the restore start in an
 *           effect, so a server render returns an empty document. Autosave starts only after the restore succeeded,
 *           so a failed load can never overwrite the saved state with a partial one; that failure throws during
 *           render to the nearest error boundary. A plan without live collaboration still restores and saves, alone.
 *           Presence is shown by `usePresence`; this hook does not re-render on presence changes.
 * Runtime: isomorphic
 * Governing contract: ADR 0225 (decision 2: Yjs co-editing and snapshots); ADR 0270 (decisions 5 and 6); ADR 0227
 *                     (Yjs for shared documents only).
 */
import { useContainer } from "@stackra/container/react";
import { useEffect, useEffectEvent, useMemo, useState } from "react";
import { Doc } from "yjs";

import type { CollaborationRoom } from "#contracts/index";
import { CollaborationSession, SnapshotService } from "#core/index";
import { yjsReplica } from "#react/shared-document/yjs-replica.function";

/**
 * The shared `Y.Doc` of `room`'s document.
 *
 * @throws the snapshot store's error when the latest snapshot cannot be loaded.
 * @throws Error outside a `ContainerProvider`, or when the container binds no `CollaborationSession` or
 *         `SnapshotService`.
 * @example
 * const doc = useSharedDocument({ document: page.id, scope });
 * const blocks = doc.getArray("blocks");
 */
export function useSharedDocument(room: CollaborationRoom): Doc {
  const container = useContainer();
  const session = container.get(CollaborationSession);
  const snapshots = container.get(SnapshotService);
  const { document } = room;
  const doc = useMemo(() => new Doc({ guid: document }), [document]);
  const [failure, setFailure] = useState<{ readonly error: unknown }>();
  const open = useEffectEvent((shared: Doc) => {
    const replica = yjsReplica(shared);
    const unbind = session.bind(room, replica);
    let live = true;
    let untrack: (() => void) | undefined;
    snapshots.restore(room, replica).then(
      () => {
        if (live) untrack = snapshots.track(room, replica);
      },
      (error: unknown) => {
        if (live) setFailure({ error });
      },
    );
    return () => {
      live = false;
      untrack?.();
      unbind();
    };
  });
  useEffect(() => open(doc), [doc]);
  if (failure !== undefined) throw failure.error;
  return doc;
}
