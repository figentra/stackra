/**
 * Stackra file contract:
 * Purpose: `ROUTE_RESPONSE`, the brand of the value `data(...)`, `ctx.data(...)`, `ctx.fieldErrors(...)` and
 *          `ctx.notFound(...)` return, so an adapter tells data with a status from plain data.
 * Boundary: internal; set as a non-enumerable property.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 16); ADR 0140 (field errors).
 */

/** The route response brand. */
export const ROUTE_RESPONSE: unique symbol = Symbol.for("@stackra/navigation.response");
