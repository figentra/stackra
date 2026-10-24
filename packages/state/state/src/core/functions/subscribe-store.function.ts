/**
 * Stackra file contract:
 * Purpose: `subscribeStore`, which calls a listener after every change of one store (a `set` that changed a field, or
 *          a hydration that did): the subscription `useStore` hands to React.
 * Boundary: internal; adds to the store's listener set. The returned function removes exactly this subscription and
 *           is safe to call twice.
 * Runtime: isomorphic
 * Governing contract: ADR 0079 (decision 2).
 */
import { internalsOf } from "#core/functions/internals-of.function";

/**
 * Subscribes `listener` to changes of `store`.
 *
 * @returns the unsubscribe function.
 * @throws TypeError when `store` is not a store instance.
 */
export function subscribeStore(store: object, listener: () => void): () => void {
  const { listeners } = internalsOf(store);
  const entry = () => listener();
  listeners.add(entry);
  return () => {
    listeners.delete(entry);
  };
}
