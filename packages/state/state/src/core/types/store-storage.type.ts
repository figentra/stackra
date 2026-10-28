/**
 * Stackra file contract:
 * Purpose: `StoreStorage`, the client storage a persisted store is constructed with: it opens the named area the store
 *          declared in `Store({ persist })`.
 * Boundary: a type only, structural; the `Storage` service of `@stackra/storage` (and its `fakeStorage()`) is what the
 *           runtime and the tests pass. This package never imports storage, so the edge stays one way.
 * Runtime: isomorphic
 * Governing contract: ADR 0256 (decision 2: one injected service with named stores); ADR 0079.
 */
import type { StoreStorageArea } from "#core/types/store-storage-area.type";

/** Client storage with named areas. */
export interface StoreStorage {
  /** The area named `name` (a `StorageArea` code such as `prefs`). */
  area: (name: string) => StoreStorageArea;
}
