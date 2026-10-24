/**
 * Stackra file contract:
 * Purpose: `MountedStore<S>`, what `mountStore` returns: the hydrated store and the in-memory area it persists into.
 * Boundary: a type only. `prefs` is named after the default area; for a store persisting elsewhere it is that area.
 * Runtime: isomorphic
 * Governing contract: ADR 0269 (decision 3); ADR 0256.
 */
import type { Store, StoreStorageArea } from "#core/index";

/** A store mounted over memory storage. */
export interface MountedStore<S extends Store> {
  /** The store, hydrated. */
  readonly store: S;

  /** The storage area the store persists into; `prefs.get(key)` reads what a reload would see. */
  readonly prefs: StoreStorageArea;
}
