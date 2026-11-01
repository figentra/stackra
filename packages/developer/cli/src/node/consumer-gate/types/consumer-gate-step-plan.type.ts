/**
 * Stackra file contract:
 * Purpose: `ConsumerGateStepPlan`, one planned step: id, argv, working directory (relative to the scratch copy) and
 *          an optional skip reason.
 * Boundary: type only.
 * Runtime: node
 * Governing contract: ADR 0500 (decision 3); STA-1813.
 */

/** One step of the plan. */
export type ConsumerGateStepPlan = {
  readonly id: string;
  readonly argv: readonly string[];
  readonly cwd: string;
  readonly skip?: string;
};
