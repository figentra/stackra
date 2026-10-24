/**
 * Stackra file contract:
 * Purpose: `Period`, what `ctx.period(input)` returns: the half-open window a query reports on, its length in days and
 *          the window of the same length just before it, which metrics compare with.
 * Boundary: a type only. Boundaries are midnights in the call's time zone; `to` is exclusive.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (metrics carry the previous period); ADR 0136 (decision 1: the time zone).
 */

/** A reporting window. */
export interface Period {
  /** The first instant inside the window. */
  readonly from: Date;

  /** The first instant after the window. */
  readonly to: Date;

  /** Whole days the window spans, at least 1. */
  readonly days: number;

  /** The window of the same length that ends at `from`. */
  readonly previous: {
    /** Its first instant. */
    readonly from: Date;
    /** Its end, which is this window's `from`. */
    readonly to: Date;
  };
}
