/**
 * Stackra file contract:
 * Purpose: `StorageBackend`, where one area of a driver persists its entries (Web Storage, and later IndexedDB, MMKV,
 *          SQLite, secure store or the desktop file system): load everything once, then save and remove one key.
 * Boundary: a type only, internal to the package's drivers. It moves stored text and knows nothing of JSON, expiry or
 *           schemas; each call may be synchronous or return a promise, so a synchronous platform is readable at once.
 * Runtime: isomorphic
 * Governing contract: ADR 0256 (decision 3: drivers per platform).
 */

/** The persistence of one storage area. */
export interface StorageBackend {
  /** Every persisted entry, as key and stored text. */
  load: () => Iterable<readonly [string, string]> | Promise<Iterable<readonly [string, string]>>;

  /** Persists `text` under `key`. */
  save: (key: string, text: string) => void | Promise<void>;

  /** Forgets the text under `key`. */
  remove: (key: string) => void | Promise<void>;
}
