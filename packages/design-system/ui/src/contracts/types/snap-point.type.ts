/**
 * Stackra file contract:
 * Purpose: `SnapPoint`, one height a bottom drawer can rest at: a number of pixels (points on native) or a share of
 *          the screen as `"50%"`.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3).
 */

/** One height a bottom drawer rests at. */
export type SnapPoint = number | `${number}%`;
