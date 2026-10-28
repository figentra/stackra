/**
 * Stackra file contract:
 * Purpose: `JobOutcome`, how one attempt of a job ended: done, retried later, dead-lettered after the last attempt,
 *          dropped after the last attempt of a job without a dead letter, or throttled before it started.
 * Boundary: an `Enum.of` value plus the type of the same name; the `outcome` of each `JobRun` the worker returns and of
 *           the `runJob` result in a test.
 * Runtime: isomorphic
 * Governing contract: ADR 0148 (decision 1: retries and the dead-letter queue; decision 2: throttles); ADR 0294 (decision 16).
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
  /** Its throttle had no token free; the job waits for the next one and the attempt is not counted. */
  Throttled: "throttled",
});

/** One of the codes above. */
export type JobOutcome = Enum.Value<typeof JobOutcome>;
