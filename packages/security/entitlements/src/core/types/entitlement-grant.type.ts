/**
 * Stackra file contract:
 * Purpose: `EntitlementGrant`, what a plan grants for one entitlement: `true` or `false` for a feature or a module, a
 *          count for a limit (`Number.POSITIVE_INFINITY` when the plan has no limit).
 * Boundary: a type only. "Not in the plan at all" is no grant (`undefined` from the source), not a value here.
 * Runtime: isomorphic
 * Governing contract: ADR 0215 (decisions 1 and 3).
 */

/** One entitlement's grant. */
export type EntitlementGrant = boolean | number;
