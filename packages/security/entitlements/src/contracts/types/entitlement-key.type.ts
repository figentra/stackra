/**
 * Stackra file contract:
 * Purpose: `EntitlementKey`, an entitlement named by its locked key rather than its class: a module key
 *          (`billing`) for a module entitlement, or `<module>.<name>` (`catalogue.product_limit`) for a feature, a
 *          limit or a value, for callers that only know the key (the marketplace registry gating a paid module's
 *          install).
 * Boundary: a type only. The key is the same string `entitlementKey(SomeEntitlement)` returns, so a key and its class
 *           resolve to the same grant in every source; `entitlementKey` checks the shape at runtime.
 * Runtime: isomorphic
 * Governing contract: ADR 0131 and 0264 (a module key is one snake_case segment and namespaces the module); ADR 0215
 *                     (decision 1: feature, limit and module entitlements); STA-1225.
 */

/** An entitlement's locked key: `<module>` or `<module>.<name>`. */
export type EntitlementKey = string;
