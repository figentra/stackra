/**
 * Stackra file contract:
 * Purpose: `mountStore(Class)`, which builds a store over fresh in-memory storage, synchronously, and hands back the
 *          area it persists into, so a test asserts both the state and what was persisted.
 * Boundary: test support; builds the class directly, without a container. The memory storage is synchronous, so the
 *           store is hydrated (from nothing) when this returns. A persisted store needs its key registered, as at
 *           runtime; a session-only store gets the empty `prefs` area.
 * Runtime: isomorphic
 * Governing contract: ADR 0269 (decision 3); ADR 0079; ADR 0256.
 */
import { kindOf } from "@stackra/container";

import { hydrateStore } from "#core/functions/hydrate-store.function";
import type { Store, StoreClass, StoreOptions } from "#core/index";
import { MemoryStoreStorage } from "#testing/memory-store-storage.fake";
import type { MountedStore } from "#testing/types/mounted-store.type";

/**
 * A store over fresh memory storage, with the area it persists into.
 *
 * @throws TypeError when `type` persists and has no registered key.
 * @example
 * const { store, prefs } = mountStore(UiStore);
 * store.setDensity(Density.Compact);
 * prefs.get("console.ui"); // { sidebarCollapsed: false, density: "compact" }
 */
export function mountStore<S extends Store>(type: StoreClass<S>): MountedStore<S> {
  const storage = new MemoryStoreStorage();
  // oxlint-disable-next-line eslint/new-cap -- reason: the store class arrives as a parameter
  const store = new type(storage);
  void hydrateStore(store);
  const persist = (kindOf(type)?.options as Partial<StoreOptions> | undefined)?.persist;
  return { store, prefs: storage.area(persist ?? "prefs") };
}
