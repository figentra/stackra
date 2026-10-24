/**
 * Stackra file contract:
 * Purpose: `yjsReplica(doc)`, the Yjs binding: it adapts a `Y.Doc` to the `DocumentReplica` seam, so the session
 *          streams its updates and the snapshot service saves and restores it.
 * Boundary: the only file of this package that imports Yjs at runtime besides `useSharedDocument`; Yjs is an optional
 *           peer, so the editor and this binding share one Yjs instance. Remote updates and snapshots are applied
 *           under a private origin and never reported as local changes, so nothing echoes. Yjs is the CRDT for shared
 *           documents only (ADR 0227: no sync engine).
 * Runtime: isomorphic
 * Governing contract: ADR 0225 (decision 2: Yjs); ADR 0270 (decision 5); ADR 0227 (Yjs for shared documents only).
 */
import { applyUpdate, encodeStateAsUpdate } from "yjs";
import type { Doc } from "yjs";

import type { DocumentReplica } from "#contracts/index";

/** The transaction origin of updates that came from elsewhere. */
const REMOTE_ORIGIN = Symbol("collaboration.remote");

/**
 * `doc` as a document replica.
 *
 * @example
 * const unbind = session.bind(room, yjsReplica(doc));
 */
export function yjsReplica(doc: Doc): DocumentReplica {
  return {
    apply: (update) => applyUpdate(doc, update, REMOTE_ORIGIN),
    encode: () => encodeStateAsUpdate(doc),
    onUpdate: (listener) => {
      const handler = (update: Uint8Array, origin: unknown): void => {
        if (origin !== REMOTE_ORIGIN) listener(update);
      };
      doc.on("update", handler);
      return () => doc.off("update", handler);
    },
  };
}
