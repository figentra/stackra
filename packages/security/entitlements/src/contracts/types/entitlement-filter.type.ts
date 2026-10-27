/**
 * Stackra file contract:
 * Purpose: `EntitlementFilter`, which records of a limit's counted model count toward the limit: field equality on
 *          the model's own fields (`{ retiredAt: null }`, `{ state: "active" }`), so a retired till stops counting.
 * Boundary: a type only. Written once in `Entitlement({ kind: Limit, counts, where })` and passed as is to
 *           `EntitlementUsage.count`; the data layer turns it into its query. Equality only, so every store can
 *           answer it; a richer rule is a projection or a state column, never a predicate here.
 * Runtime: isomorphic
 * Governing contract: ADR 0215 (decisions 3 and 7: a limit names what it counts); STA-913 (the `counts` filter).
 */

/** Field name to the value a counted record must hold. */
export type EntitlementFilter = Readonly<Record<string, string | number | boolean | null>>;
