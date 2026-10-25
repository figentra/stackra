/**
 * Stackra file contract:
 * Purpose: `WorkflowResult<O>`, what `runWorkflow` resolves to: whether the run answered, its output or refusal, and
 *          the run as the journal recorded it.
 * Boundary: a type only. A run that parks on a wait answers with its output over the results so far, so `ok` with a
 *           `waiting` run is a parked run.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); the actions precedent (`RunResult`).
 */
import type { Refusal } from "@stackra/errors";

import type { WorkflowRun } from "#core/index";

/** The outcome of one run started in a test. */
export interface WorkflowResult<O> {
  /** `true` when the run completed or parked, `false` when it compensated with a refusal. */
  readonly ok: boolean;

  /** `output(run)`; `undefined` for a refused run. */
  readonly output: O | undefined;

  /** The refusal of a refused run; `undefined` when `ok`. */
  readonly error: Refusal | undefined;

  /** The run and its steps, as the journal recorded them. */
  readonly run: WorkflowRun;
}
