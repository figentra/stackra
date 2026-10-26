/**
 * Stackra file contract:
 * Purpose: `HOLD_LINK_FIELDS`, the subject-link fields each model declared with `registerHoldLinks`: the fields whose
 *          public id ties a row to a hold subject (`Order` to its `customerId`).
 * Boundary: internal; written only by `registerHoldLinks`, read by the disposal paths to build `HoldLinks`. A model
 *           not in it reports no links.
 * Runtime: node
 * Governing contract: ADR 0134 (2026-10-24 amendment); STA-1241.
 */

/** Model class to its link fields. */
export const HOLD_LINK_FIELDS = new WeakMap<object, readonly string[]>();
