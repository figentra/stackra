/**
 * Stackra file contract:
 * Purpose: `internalsOf`, the bookkeeping of one store instance, for the functions that persist, hydrate and notify.
 * Boundary: internal; reads `STORE_INTERNALS` only. Anything that is not a store instance throws, so a hook handed the
 *           wrong object fails loudly instead of never re-rendering.
 * Runtime: isomorphic
 * Governing contract: ADR 0079 (decision 2).
 */
import { STORE_INTERNALS } from "#core/constants/store-internals.constant";
import type { StoreInternals } from "#core/types/store-internals.type";

/**
 * The bookkeeping of `store`.
 *
 * @throws TypeError when `store` was not built from a `Store` class.
 */
export function internalsOf(store: object): StoreInternals {
  const internals = STORE_INTERNALS.get(store);
  if (internals === undefined)
    throw new TypeError(
      "Not a store: declare the class with `extends Store` or `extends Store({ persist })`",
    );
  return internals;
}
