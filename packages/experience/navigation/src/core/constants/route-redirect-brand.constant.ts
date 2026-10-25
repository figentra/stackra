/**
 * Stackra file contract:
 * Purpose: `ROUTE_REDIRECT`, the brand of the value `ctx.redirect(...)` returns, so an adapter tells a redirect from data.
 * Boundary: internal; set as a non-enumerable property, so `toEqual({ redirect, params })` still matches in a test.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 16).
 */

/** The redirect brand. */
export const ROUTE_REDIRECT: unique symbol = Symbol.for("@stackra/navigation.redirect");
