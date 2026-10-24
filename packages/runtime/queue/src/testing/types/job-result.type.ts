/**
 * Stackra file contract:
 * Purpose: `JobResult<O>`, what `runJob(...)` resolves to: the job's id, how its last attempt ended, how many attempts
 *          it had, the output or the last error, and every attempt in order.
 * Boundary: a type only; `toDeadLetter` reads `outcome` and `attempts`. A failed job resolves (never rejects), so a test
 *           asserts the outcome.
 * Runtime: node
 * Governing contract: ADR 0269 (testing helpers); ADR 0148 (decision 1).
 */
import type { PublicId } from "@stackra/contracts";

import type { JobOutcome, JobRun } from "#core/index";

/** The outcome of one job run to its end in a test. */
export interface JobResult<O> {
  /** The job's id. */
  readonly id: PublicId<"job">;

  /** How its last attempt ended: never `retried`. */
  readonly outcome: JobOutcome;

  /** Attempts made. */
  readonly attempts: number;

  /** The action's output when the job is done; `undefined` otherwise. */
  readonly output: O | undefined;

  /** What the last attempt threw when it failed; `undefined` when done. */
  readonly error: unknown;

  /** Every attempt, oldest first. */
  readonly runs: readonly JobRun[];
}
