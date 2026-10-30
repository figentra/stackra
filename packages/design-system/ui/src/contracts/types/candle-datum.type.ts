/**
 * Stackra file contract:
 * Purpose: `CandleDatum`, one period of a candlestick chart: its open, high, low and close prices and its volume.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371.
 */

/** One period's prices. */
export interface CandleDatum {
  /** The period: an ISO date or a label. */
  readonly date: string;
  /** The price at the start of the period. */
  readonly open: number;
  /** The highest price in the period. */
  readonly high: number;
  /** The lowest price in the period. */
  readonly low: number;
  /** The price at the end of the period. */
  readonly close: number;
  /** The units traded; drawn as bars along the bottom when present. */
  readonly volume?: number | undefined;
}
