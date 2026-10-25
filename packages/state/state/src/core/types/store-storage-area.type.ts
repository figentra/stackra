/**
 * Stackra file contract:
 * Purpose: `StoreStorageArea`, what a persisted store needs from one named area of client storage (`prefs`,
 *          `session`): read and write one value by key.
 * Boundary: a type only, structural, so the area of `@stackra/storage` satisfies it without this package importing
 *           storage (ADR 0256). A synchronous driver (mmkv, local storage, the test fake) returns values directly; an
 *           asynchronous one (IndexedDB) returns promises, and the store hydrates after they settle.
 * Runtime: isomorphic
 * Governing contract: ADR 0256 (decisions 2 and 3); ADR 0079 (decision 2).
 */

/** One named area of client storage, read and written by key. */
export interface StoreStorageArea {
  /** The value stored under `key`, `undefined` when nothing is; a promise of it on an asynchronous driver. */
  get(key: string): unknown;

  /** Stores `value`, a plain JSON-safe object, under `key`; may return a promise on an asynchronous driver. */
  set(key: string, value: unknown): unknown;
}
