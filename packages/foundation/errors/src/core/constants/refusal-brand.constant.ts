/**
 * Stackra file contract:
 * Purpose: `REFUSAL_BRAND`, the registry symbol every refusal carries on its prototype, so `isRefusal` recognises a
 *          refusal built by another copy of this package (another bundle, a worker, a test double) where `instanceof`
 *          would fail.
 * Boundary: internal; not exported from an entry. `Symbol.for` makes the same symbol in every realm of a process.
 * Runtime: isomorphic
 * Governing contract: ADR 0232 (decision 2), ADR 0140.
 */

/** Set to `true` on `Refusal`'s prototype. */
export const REFUSAL_BRAND: unique symbol = Symbol.for("stackra.errors.refusal");
