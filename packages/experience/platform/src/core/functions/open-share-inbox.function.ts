/**
 * Stackra file contract:
 * Purpose: `openShareInbox`, which opens the device's share inbox: the IndexedDB database the service worker writes a
 *          shared payload into and the share page takes it from, once.
 * Boundary: internal; not exported from the entry. The database is `stackra_platform`, store `share_inbox`, keyed by
 *           the payload id; device-local, never synced or cached as a response.
 * Runtime: isomorphic
 * Governing contract: ADR 0255 (share target); ADR 0256 (device-local data).
 */
import { idbRequest } from "#core/functions/idb-request.function";

/** The inbox database name. */
const DATABASE = "stackra_platform";

/** The object store of shared payloads. */
const STORE = "share_inbox";

/**
 * The open inbox database; creates its store on first use.
 *
 * @throws Error when IndexedDB is missing or refuses to open.
 * @example
 * const db = await openShareInbox();
 * db.transaction("share_inbox", "readwrite");
 */
export function openShareInbox(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined")
    return Promise.reject(new Error("IndexedDB is unavailable"));
  const request = indexedDB.open(DATABASE, 1);
  request.addEventListener("upgradeneeded", () => {
    if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE);
  });
  return idbRequest(request);
}
