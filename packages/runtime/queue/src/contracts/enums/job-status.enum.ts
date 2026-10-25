/**
 * Stackra file contract:
 * Purpose: `JobStatus`, where a stored job is: waiting for its turn, running under a reservation, or dead-lettered after
 *          its last attempt.
 * Boundary: an `Enum.of` value plus the type of the same name; the codes are the `status` column of `queue.jobs`. A
 *           job that finished, or failed for good without a dead letter, is removed, so it has no status.
 * Runtime: isomorphic
 * Governing contract: ADR 0148 (decision 1: dead-letter queue with replay); ADR 0294 (decision 16); ADR 0231 (codes).
 */
import { Enum } from "@stackra/contracts";

/** The states of a stored job. */
export const JobStatus = Enum.of({
  /** Due at its `runAt`; any worker of its queue may reserve it then. */
  Waiting: "waiting",
  /** Reserved by a worker; taken again by another once its reservation lapses. */
  Running: "running",
  /** Failed its last attempt and kept for a redrive. */
  Dead: "dead",
});

/** One of the codes above. */
export type JobStatus = Enum.Value<typeof JobStatus>;
