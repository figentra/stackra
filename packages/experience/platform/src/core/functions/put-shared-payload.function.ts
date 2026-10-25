/**
 * Stackra file contract:
 * Purpose: `putSharedPayload`, how the service worker keeps what another app shared: the payload goes into the share
 *          inbox under a fresh id, which the worker then redirects the share page with (`/share?shared=<id>`).
 * Boundary: internal; not exported from the entry. Files are kept as `File` values (IndexedDB clones them); nothing is
 *           uploaded or cached as a response.
 * Runtime: isomorphic
 * Governing contract: ADR 0255 (share target).
 */
import type { SharedPayload } from "#contracts/types/shared-payload.type";
import { idbRequest } from "#core/functions/idb-request.function";
import { openShareInbox } from "#core/functions/open-share-inbox.function";

/**
 * Stores `payload` and returns its id.
 *
 * @throws Error when IndexedDB is missing or the write fails.
 * @example
 * const id = await putSharedPayload({ title, text, url, files });
 */
export async function putSharedPayload(payload: SharedPayload): Promise<string> {
  const id = crypto.randomUUID();
  const db = await openShareInbox();
  try {
    await idbRequest(
      db.transaction("share_inbox", "readwrite").objectStore("share_inbox").put(payload, id),
    );
    return id;
  } finally {
    db.close();
  }
}
