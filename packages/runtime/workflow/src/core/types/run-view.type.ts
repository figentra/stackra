/**
 * Stackra file contract:
 * Purpose: `RunView`, what `NativeWorkflowRunnerDriver.view` answers for one run: the run as journalled, for the
 *          caller's access checks, and its workflow's `output` over the results so far, the only part a caller sees.
 * Boundary: a type only; `workflow.run.get` returns the status and `output`, never the steps or their results.
 * Runtime: isomorphic
 * Governing contract: ADR 0101 (`ctx.run`); STA-2613.
 */
import type { WorkflowRun } from "#core/types/workflow-run.type";

/** One run and its caller-facing output. */
export interface RunView {
  /** The run as the journal holds it. */
  readonly run: WorkflowRun;
  /** The workflow's `output(run)` as JSON, or null when it has none or it cannot be computed yet. */
  readonly output: unknown;
}
