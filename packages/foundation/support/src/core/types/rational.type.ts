/**
 * Stackra file contract:
 * Purpose: `Rational`, an exact fraction of two big integers, the number a `Quantity` keeps so a conversion never
 *          loses a digit (`1 in` is exactly `127/5000 m`).
 * Boundary: a type only; `den` is always positive and the fraction always reduced by the functions that build one.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file).
 */

/** `num / den`, reduced, `den > 0`. */
export interface Rational {
  /** The numerator, carrying the sign. */
  readonly num: bigint;

  /** The denominator, positive. */
  readonly den: bigint;
}
