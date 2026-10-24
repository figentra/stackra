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
import { internalsOf } from "#core/functions/internals-of.function";
import type { StoreInternals } from "#core/types/store-internals.type";

/** Applies a saved state to `store` and notifies its listeners when a field changed. */
function apply(store: Record<string, unknown>, internals: StoreInternals, saved: unknown): void {
  if (typeof saved !== "object" || saved === null) return;
  let changed = false;
  for (const [field, value] of Object.entries(saved)) {
    if (!Object.hasOwn(store, field) || internals.written.has(field)) continue;
    const current = store[field];
    if (typeof current === "function" || Object.is(current, value)) continue;
    // shortcut: a type check against the default only; validate with the store's generated `X$` once gen registers it.
    if (current !== null && current !== undefined && typeof value !== typeof current) continue;
    store[field] = value;
    changed = true;
  }
  if (!changed) return;
  internals.version += 1;
  // oxlint-disable-next-line unicorn/no-useless-spread -- reason: a copy, so a listener that unsubscribes another mid-loop does not skip it
  for (const listener of [...internals.listeners]) listener();
}

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
    apply(store as Record<string, unknown>, internals, saved);
    internals.hydration = true;
    return undefined;
  }
  const running = saved.then((value: unknown) => {
    apply(store as Record<string, unknown>, internals, value);
    internals.hydration = true;
  });
  internals.hydration = running;
  return running;
}
