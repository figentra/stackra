/**
 * Stackra file contract:
 * Purpose: `StoreOptions`, what `Store({ ... })` takes: the storage area the store's state persists into.
 * Boundary: a type only. A store without `persist` is session-only and is written as the bare `extends Store`. The
 *           area is a `StorageArea` code of `@stackra/storage`, typed as a string here so this package needs no
 *           storage import; a `StorageArea` value is a plain code string, so it fits.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 16: `Store({ persist })`); ADR 0256.
 */

/** The options of a persisted store. */
export interface StoreOptions {
  /** The storage area the state persists into, such as `StorageArea.Prefs`. */
  readonly persist: string;
}
