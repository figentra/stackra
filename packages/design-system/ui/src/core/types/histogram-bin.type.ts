/**
 * Stackra file contract:
 * Purpose: `HistogramBin`, one bin of a histogram (`histogramBinsOf`): its edges and how many values fall in it.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); STA-1371.
 */

/** One bin: values from `from` up to `to` (the last bin includes `to`). */
export interface HistogramBin {
  /** The lower edge of the bin. */
  readonly from: number;
  /** The upper edge of the bin. */
  readonly to: number;
  /** How many values fall in the bin. */
  readonly count: number;
}
