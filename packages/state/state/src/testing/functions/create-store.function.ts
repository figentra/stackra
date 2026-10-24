/**
 * Stackra file contract:
 * Purpose: `createStore(Class, { storage })`, which builds a store over the given client storage (in memory when none
 *          is given) and resolves once it is hydrated: two stores created over one storage share what the first wrote.
 * Boundary: test support; builds the class directly, without a container. A persisted store needs its key registered
 *           (the generated wiring the test setup loads, or `registerStores`), as at runtime.
 * Runtime: isomorphic
 * Governing contract: ADR 0269 (decision 3); ADR 0079; ADR 0256.
 */
import { hydrateStore } from "#core/functions/hydrate-store.function";
import type { Store, StoreClass, StoreStorage } from "#core/index";
import { MemoryStoreStorage } from "#testing/memory-store-storage.fake";

/**
 * A hydrated instance of `type`.
 *
 * @throws TypeError when `type` persists and has no registered key.
 * @example
 * const storage = fakeStorage();
 * const first = await createStore(PreferencesStore, { storage });
 * first.rememberTenant("usr_1", "ten_2");
 * const second = await createStore(PreferencesStore, { storage });
 * second.tenantFor("usr_1"); // "ten_2"
 */
export async function createStore<S extends Store>(
  type: StoreClass<S>,
  options: { readonly storage?: StoreStorage } = {},
): Promise<S> {
  // oxlint-disable-next-line eslint/new-cap -- reason: the store class arrives as a parameter
  const store = new type(options.storage ?? new MemoryStoreStorage());
  await hydrateStore(store);
  return store;
}
