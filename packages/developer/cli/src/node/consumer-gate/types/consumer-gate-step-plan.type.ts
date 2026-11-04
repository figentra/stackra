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
  /** The step id, such as `typecheck` or `test:int/billing`. */
  readonly id: string;

  /** The command the step runs, without a shell. */
  readonly argv: readonly string[];

  /** The working directory, relative to the scratch copy. */
  readonly cwd: string;

  /** Why the step is skipped, when it is. */
  readonly skip?: string;
};
