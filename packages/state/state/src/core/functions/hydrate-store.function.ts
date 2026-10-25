/**
 * Stackra file contract:
 * Purpose: `hydrateStore`, which reads a persisted store's saved state from its storage area onto its fields, once:
 *          synchronously for a synchronous driver, or through the returned promise for an asynchronous one.
 * Boundary: internal; the `Store` constructor schedules it on a microtask (after the subclass's field initializers),
 *           and `createStore`, `mountStore` and the runtime call it directly. Calls after the first return the same
 *           result. A saved field is applied only when the store declares it, `set` has not written it since
 *           construction, and its type still matches the default, so old or foreign data never replaces a newer write
 *           or breaks a field. Listeners are notified when anything changed; nothing is written back.
 * Runtime: isomorphic
 * Governing contract: ADR 0079 (decision 2); ADR 0256.
 */
import { applyStoreState } from "#core/functions/apply-store-state.function";
import { internalsOf } from "#core/functions/internals-of.function";

/**
 * Hydrates `store` from its storage area.
 *
 * @returns undefined once hydrated (or when nothing persists), or the promise of an asynchronous read.
 * @throws TypeError when `store` is not a store instance.
 * @example
 * const store = new PreferencesStore(storage);
 * await hydrateStore(store);
 */
export function hydrateStore(store: object): Promise<void> | undefined {
  const internals = internalsOf(store);
  if (internals.hydration === true) return undefined;
  if (internals.hydration !== false) return internals.hydration;
  const { area, key } = internals;
  if (area === undefined || key === undefined) {
    internals.hydration = true;
    return undefined;
  }
  const saved = area.get(key);
  if (!(saved instanceof Promise)) {
    applyStoreState(store as Record<string, unknown>, internals, saved, false);
    internals.hydration = true;
    return undefined;
  }
  const running = saved.then((value: unknown) => {
    applyStoreState(store as Record<string, unknown>, internals, value, false);
    internals.hydration = true;
  });
  internals.hydration = running;
  return running;
}
