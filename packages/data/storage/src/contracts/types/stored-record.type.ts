/**
 * Stackra file contract:
 * Purpose: `StoredRecord<T>`, the stored state of one class that persists itself (a `@stackra/state` store), as
 *          `storage.store(PreferencesStore)` returns it: read, write and clear under the key and area gen registered.
 * Boundary: a type only. The state is plain JSON written by its owner; no schema checks it here, because the owner's
 *           methods are its only writers.
 * Runtime: isomorphic
 * Governing contract: ADR 0256 (decision 2), ADR 0079 (persisted stores), ADR 0294 (decision 20).
 */
import type { StorageWriteOptions } from "#contracts/types/storage-write-options.type";

/**
 * The persisted state of one class.
 *
 * @example
 * await storage.store(PreferencesStore).write({ scopeByUser: { usr_1: "ten_2" } });
 */
export interface StoredRecord<T extends object> {
  /** The stored state, or `undefined` when nothing is stored or it expired. */
  read: () => Partial<T> | undefined;

  /** Replaces the stored state. */
  write: (state: Partial<T>, options?: StorageWriteOptions) => void;

  /** Removes the stored state. */
  clear: () => void;
}
