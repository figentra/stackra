/**
 * Stackra file contract:
 * Purpose: `FunnelStage`, one step of a funnel: its key, what people call it and how many reached it.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0340 (decision 9: the chart set); STA-1371.
 */

/** One step of a funnel chart. */
export interface FunnelStage {
  readonly key: string;
  /** The step's name: "Visited", "Added to cart", "Paid". */
  readonly label: string;
  /** How many reached the step. */
  readonly value: number;
}
