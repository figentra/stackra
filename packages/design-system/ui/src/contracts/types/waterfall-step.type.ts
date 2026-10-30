/**
 * Stackra file contract:
 * Purpose: `WaterfallStep`, one change between a waterfall chart's start and end totals.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371.
 */

/** One step of a waterfall. */
export interface WaterfallStep {
  readonly key: string;
  /** What changed: "New customers", "Refunds". */
  readonly label: string;
  /** The change: positive raises the running total, negative lowers it. */
  readonly value: number;
}
