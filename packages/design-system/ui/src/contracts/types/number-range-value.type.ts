/**
 * Stackra file contract:
 * Purpose: the value of a number filter: an inclusive lower and upper bound, either of which may be absent, so "at
 *          least 10", "at most 99" and "between 10 and 99" are one shape the server turns into one query.
 * Boundary: types only. `null` means the bound is not set; a range with both bounds `null` is an empty filter.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0318.
 */

/** An inclusive range of numbers. */
export interface NumberRangeValue {
  /** The smallest number that matches, or `null` for no lower bound. */
  readonly min: number | null;
  /** The largest number that matches, or `null` for no upper bound. */
  readonly max: number | null;
}
