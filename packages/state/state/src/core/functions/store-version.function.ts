/**
 * Stackra file contract:
 * Purpose: `storeVersion`, a number that changes on every change of one store: the snapshot `useStore` compares, so a
 *          component re-renders exactly when the store changed.
 * Boundary: internal; reads the store's bookkeeping only.
 * Runtime: isomorphic
 * Governing contract: ADR 0079 (decision 2).
 */
import { internalsOf } from "#core/functions/internals-of.function";

/**
 * The current version of `store`; 0 until its first change.
 *
 * @throws TypeError when `store` is not a store instance.
 */
export function storeVersion(store: object): number {
  return internalsOf(store).version;
}
