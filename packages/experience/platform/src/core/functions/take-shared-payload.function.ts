/**
 * Stackra file contract:
 * Purpose: `takeSharedPayload`, how the share page reads what the service worker kept: the payload under `id`,
 *          removed in the same transaction, so a reload or a second tab gets `null`.
 * Boundary: internal; not exported from the entry. An unknown id, or an entry that is not a payload, reads as `null`.
 * Runtime: isomorphic
 * Governing contract: ADR 0255 (share target).
 */
import type { SharedPayload } from "#contracts/types/shared-payload.type";
import { idbRequest } from "#core/functions/idb-request.function";
import { openShareInbox } from "#core/functions/open-share-inbox.function";

/** Whether a stored value has the payload's shape. */
function isPayload(value: unknown): value is SharedPayload {
  return (
    typeof value === "object" && value !== null && Array.isArray((value as SharedPayload).files)
  );
}

/**
 * The payload kept under `id`, or `null`; removed as it is read.
 *
 * @throws Error when IndexedDB is missing or the read fails.
 * @example
 * const shared = await takeSharedPayload(search.shared);
 */
export async function takeSharedPayload(id: string): Promise<SharedPayload | null> {
  const db = await openShareInbox();
  try {
    const store = db.transaction("share_inbox", "readwrite").objectStore("share_inbox");
    const value: unknown = await idbRequest(store.get(id));
    if (value === undefined) return null;
    await idbRequest(store.delete(id));
    return isPayload(value) ? value : null;
  } finally {
    db.close();
  }
}
