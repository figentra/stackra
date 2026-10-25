/**
 * Stackra file contract:
 * Purpose: `idbRequest`, which turns one IndexedDB request into a promise: the share inbox's open, get, put and
 *          delete go through it.
 * Boundary: internal; not exported from the entry. It wraps the request only; transactions are the caller's.
 * Runtime: isomorphic
 * Governing contract: ADR 0255 (share target).
 */

/**
 * Resolves with the request's result, rejects with its error.
 *
 * @example
 * const db = await idbRequest(indexedDB.open("stackra_platform", 1));
 */
export function idbRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.addEventListener("success", () => resolve(request.result));
    request.addEventListener("error", () =>
      reject(request.error ?? new Error("IndexedDB request failed")),
    );
  });
}
