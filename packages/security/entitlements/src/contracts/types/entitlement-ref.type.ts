/**
 * Stackra file contract:
 * Purpose: `EntitlementRef`, an entitlement class as the leaf entry names it: any class whose instances carry the
 *          `entitlement` kind brand, which is exactly what `Entitlement({...})` returns.
 * Boundary: a type only, structural, so the `EntitlementSource` port can live in `./contracts` without importing the
 *           core `Entitlement` base. Core's `EntitlementClass` is assignable to it and it to `EntitlementClass`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15: the leaf entry imports no other entry); ADR 0215 (decision 1).
 */

/** An entitlement class. */
export type EntitlementRef = new () => { readonly "~kind": "entitlement" };
