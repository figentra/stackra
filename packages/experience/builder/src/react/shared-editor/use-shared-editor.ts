/**
 * Stackra file contract:
 * Purpose: `useSharedEditor(room, options)`, `useEditor` for the kinds ADR 0270 co-edits in full (page, screen, app
 *          shell, post, article): the editor is bound to the room's Yjs document through `@stackra/collaboration`,
 *          restored from the latest snapshot, synced while the plan grants live collaboration and autosaved.
 * Boundary: it drives `CollaborationSession.bind` and `SnapshotService` itself rather than `useSharedDocument`, because
 *           the editor may seed the shared document only after the restore, or a stale tree could race the saved one.
 *           Until the restore finishes it returns `undefined` (render a placeholder; nothing can be edited and lost);
 *           a failed restore throws to the nearest error boundary and nothing is saved. A plan without live
 *           collaboration still restores and saves, alone. Presence and cursors are `usePresence` and `useCursors`.
 *           The editor is created on first render; remount with a `key` (the document's id) to open another document.
 * Runtime: isomorphic
 * Governing contract: ADR 0270 (decisions 4, 5 and 6); ADR 0225 (decision 2); ADR 0227 (Yjs for shared documents
 *                     only); live room channel: ADR 0346 (planned).
 */
import { CollaborationSession, SnapshotService } from "@stackra/collaboration";
import type { CollaborationRoom } from "@stackra/collaboration/contracts";
import { yjsReplica } from "@stackra/collaboration/react";
import { useContainer } from "@stackra/container/react";
import { useEffect, useEffectEvent, useState } from "react";
import { Doc } from "yjs";

import type { EditorOptions, EditorState } from "#contracts/index";
import type { Editor } from "#core/index";
import { useEditor } from "#react/editor/use-editor";
import { bindSharedDocument } from "#react/shared-editor/bind-shared-document.function";

/**
 * The co-edited document's state and its editor, or `undefined` until the saved state is restored.
 *
 * @throws the snapshot store's error when the latest snapshot cannot be loaded.
 * @throws DocumentInvalidError when `options.root` is not a well-formed tree.
 * @throws Error outside a `ContainerProvider`, or when the container binds no `CollaborationSession` or
 *         `SnapshotService`.
 * @example
 * const shared = useSharedEditor({ document: page.id, scope }, { root: page.root, blocks });
 * if (shared === undefined) return <CanvasSkeleton />;
 * const [state, editor] = shared;
 */
export function useSharedEditor(
  room: CollaborationRoom,
  options: EditorOptions,
): readonly [EditorState, Editor] | undefined {
  const container = useContainer();
  const session = container.get(CollaborationSession);
  const snapshots = container.get(SnapshotService);
  const [state, editor] = useEditor(options);
  const [ready, setReady] = useState(false);
  const [failure, setFailure] = useState<{ readonly error: unknown }>();
  const open = useEffectEvent((target: Editor) => {
    const doc = new Doc({ guid: room.document });
    const replica = yjsReplica(doc);
    const unbindReplica = session.bind(room, replica);
    let live = true;
    let untrack: (() => void) | undefined;
    let unbindEditor: (() => void) | undefined;
    snapshots.restore(room, replica).then(
      () => {
        if (!live) return;
        // Track first, so a seed written by the binding is saved like any local change.
        untrack = snapshots.track(room, replica);
        unbindEditor = bindSharedDocument(target, doc);
        setReady(true);
      },
      (error: unknown) => {
        if (live) setFailure({ error });
      },
    );
    return () => {
      live = false;
      unbindEditor?.();
      untrack?.();
      unbindReplica();
    };
  });
  useEffect(() => open(editor), [editor]);
  if (failure !== undefined) throw failure.error;
  return ready ? [state, editor] : undefined;
}
