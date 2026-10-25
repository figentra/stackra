/**
 * Stackra file contract:
 * Purpose: `STORE_KEYS`, the derived key of every registered store class (`console.ui`), the key its persisted state is
 *          stored under.
 * Boundary: internal; written by `registerStores` (the generated wiring, or a test), read through `storeKeyOf`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 20: identities are derived, locked in the manifest).
 */

/** Store class to its derived key. */
export const STORE_KEYS = new WeakMap<object, string>();
