/**
 * Stackra file contract:
 * Purpose: `applyStoreState`, which applies a saved state to a store's fields and notifies its listeners when a field
 *          changed: the one validation hydration and cross-tab sync share.
 * Boundary: internal; nothing is written back. A field is applied only when the store declares it and its type still
 *           matches the default, so old or foreign data never breaks a field. Hydration keeps a field `set` has written
 *           since construction; a state another context committed (`overwrite`) replaces it, because that write is newer.
 * Runtime: isomorphic
 * Governing contract: ADR 0079 (decision 2); ADR 0256.
 */
import type { StoreInternals } from "#core/types/store-internals.type";

/** Applies `saved` to `store`; `overwrite` lets it replace fields `set` has written. */
export function applyStoreState(
  store: Record<string, unknown>,
  internals: StoreInternals,
  saved: unknown,
  overwrite: boolean,
): void {
  if (typeof saved !== "object" || saved === null) return;
  let changed = false;
  for (const [field, value] of Object.entries(saved)) {
    if (!Object.hasOwn(store, field) || (!overwrite && internals.written.has(field))) continue;
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
