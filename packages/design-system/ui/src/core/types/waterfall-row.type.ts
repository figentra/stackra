/**
 * Stackra file contract:
 * Purpose: `WaterfallRow`, one bar of a waterfall chart: where it floats from and to, the change it shows and its kind.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371.
 */

/** One bar of a waterfall. */
export interface WaterfallRow {
  readonly key: string;
  readonly label: string;
  /** The bar's lower and upper ends on the value axis. */
  readonly low: number;
  readonly high: number;
  /** The step's change, or the total for a total bar. */
  readonly value: number;
  /** The running total after this bar. */
  readonly total: number;
  /** `total` for the start and end bars, `up` or `down` for a step. */
  readonly kind: "total" | "up" | "down";
}
