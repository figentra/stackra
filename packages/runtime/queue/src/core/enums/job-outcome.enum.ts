/**
 * Stackra file contract:
 * Purpose: `JobOutcome`, how one attempt of a job ended: done, retried later, dead-lettered after the last attempt, or
 *          dropped after the last attempt of a job without a dead letter.
 * Boundary: an `Enum.of` value plus the type of the same name; the `outcome` of each `JobRun` the worker returns and of
 *           the `runJob` result in a test.
 * Runtime: isomorphic
 * Governing contract: ADR 0148 (decision 1: retries and the dead-letter queue); ADR 0294 (decision 16).
 */
import { Enum } from "@stackra/contracts";

/** The ends of one attempt. */
export const JobOutcome = Enum.of({
  /** The action returned; the job is removed. */
  Done: "done",
  /** It failed with attempts left; the job waits for its backoff. */
  Retried: "retried",
  /** It failed for good and the action keeps a dead letter; the job waits for a redrive. */
  DeadLettered: "dead_lettered",
  /** It failed for good and the action keeps no dead letter; the job is removed and the failure logged. */
  Dropped: "dropped",
});

/** One of the codes above. */
export type JobOutcome = Enum.Value<typeof JobOutcome>;
