/**
 * Stackra file contract:
 * Purpose: `StepStatus`, where one step of a run stands in the journal: running (or retrying), parked on its signal,
 *          done, skipped by its `when`, failed after its last attempt, timed out waiting, or undone.
 * Boundary: an `Enum.of` value plus the type of the same name; the journal stores the code. A step that never started
 *           has no journal row, so there is no pending code. Only the engine writes it, so no state machine guards it:
 *           @stackra/state-machine governs a model field, and the journal rows are not models.
 * Runtime: isomorphic
 * Governing contract: ADR 0102 (decisions 1 and 2); ADR 0152 (decision 1 and its 0294 note); ADR 0294 (decision 18:
 *                     `when`, `waitFor`, `timeout`); ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";

/**
 * The statuses of a step.
 *
 * @example
 * expect(record.steps.map((step) => [step.name, step.status])).toEqual([["price", StepStatus.Done]]);
 */
export const StepStatus = Enum.of({
  /** Started, or failed an attempt and waiting for its next one; its progress is kept. */
  Running: "running",
  /** Parked until its signal arrives or its timeout passes. */
  Waiting: "waiting",
  /** Its body committed; its result is kept with the run. */
  Done: "done",
  /** Its `when` was false, so it did not run. */
  Skipped: "skipped",
  /** Its last attempt threw, so the run compensated. */
  Failed: "failed",
  /** Its wait, or the run, ran out of time before it ran, so the run compensated. */
  TimedOut: "timed_out",
  /** It was done, and its `undo<Step>` ran after a later step failed. */
  Compensated: "compensated",
});

/** One of the codes above. */
export type StepStatus = Enum.Value<typeof StepStatus>;
