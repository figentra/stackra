/**
 * Stackra file contract:
 * Purpose: `IsoDate`, a Gregorian calendar date as `YYYY-MM-DD`, the one form dates are stored and passed in; Hijri is
 *          a view computed from it.
 * Boundary: a type only. Every function that takes one checks it and throws a `RangeError` for a malformed or
 *           impossible date (`2026-02-30`).
 * Runtime: isomorphic
 * Governing contract: ADR 0366 (decision 2: one storage form, ISO Gregorian).
 */

/** A date as `YYYY-MM-DD`. */
export type IsoDate = string;
