/**
 * Stackra file contract:
 * Purpose: `WorkflowRunStatus`, where one workflow run stands: running its steps, parked on a wait, finished,
 *          undoing its completed steps after a failure or a timeout, undone, or stuck because an undo itself failed.
 * Boundary: an `Enum.of` value plus the type of the same name; the journal stores the code. Only the engine writes it.
 *          `failed` means an undo failed and an operator must act (ADR 0152 decision 4: retry and cancel are actions);
 *          a run whose failing step was undone cleanly ends `compensated`, the error it failed with kept on the run.
 * Runtime: isomorphic
 * Governing contract: ADR 0102 (decisions 1 and 2: the journal, the saga); ADR 0152 (decision 1 and its 0294 note:
 *                     waits and timeouts); ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";

/**
 * The statuses of a run.
 *
 * @example
 * expect((await app.workflows.last(CreateOrderWorkflow)).status).toBe(WorkflowRunStatus.Compensated);
 */
export const WorkflowRunStatus = Enum.of({
  /** Its steps are running, in this process or another. */
  Running: "running",
  /** Parked before a step that waits for a signal; the engine resumes it when the signal or the timeout comes. */
  Waiting: "waiting",
  /** Every step is done or skipped. */
  Completed: "completed",
  /** A step failed or timed out and the completed steps are being undone, last first. */
  Compensating: "compensating",
  /** A step failed or timed out and every completed step with an undo was undone. */
  Compensated: "compensated",
  /** An undo failed; the run stays as it is until an operator acts. */
  Failed: "failed",
});

/** One of the codes above. */
export type WorkflowRunStatus = Enum.Value<typeof WorkflowRunStatus>;
