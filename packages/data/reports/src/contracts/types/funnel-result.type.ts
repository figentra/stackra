/**
 * Stackra file contract:
 * Purpose: `FunnelResult`, a computed funnel: per step, the people who reached it, their share of the first step and
 *          the median time from the previous step.
 * Boundary: a type only; counts of people, never who they are.
 * Runtime: isomorphic
 * Governing contract: ADR 0163 (decision 5 as amended 2026-10-28); ADR 0294 (decision 15: the leaf entry).
 */
import type { FunnelStepResult } from "#contracts/types/funnel-step-result.type";

/** A computed funnel. */
export interface FunnelResult {
  /** The steps in query order. */
  readonly steps: readonly FunnelStepResult[];
}
