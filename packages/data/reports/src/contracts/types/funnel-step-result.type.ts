/**
 * Stackra file contract:
 * Purpose: `FunnelStepResult`, one step of a computed funnel: the people who reached it, their share of the first step
 *          and the median time from the previous step.
 * Boundary: a type only; counts of people, never who they are.
 * Runtime: isomorphic
 * Governing contract: ADR 0163 (decision 5 as amended 2026-10-28); ADR 0294 (decision 15: the leaf entry).
 */

/** One step of a computed funnel. */
export interface FunnelStepResult {
  /** The step's event name. */
  readonly event: string;

  /** People who reached this step in order within the window. */
  readonly people: number;

  /** `people` over the first step's people, 0 to 1; 0 when nobody entered. */
  readonly conversion: number;

  /** Median seconds from the previous step; null for the first step or when nobody converted. */
  readonly medianSeconds: number | null;
}
