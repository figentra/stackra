/**
 * Stackra file contract:
 * Purpose: `JobNotDueError`, the refusal a broker-delivered job meets when it arrives before its `runAt` (a delayed job
 *          or a retry waiting out its backoff): the subscription handler rejects, so the broker delivers it again later.
 * Boundary: raised by `BrokerQueueDriver.claim` only; nothing runs and nothing is recorded. Kind `Unavailable`,
 *           retryable, code `job_not_due`; the one detail is the job's due time as ISO 8601.
 * Runtime: isomorphic
 * Governing contract: ADR 0148 (decisions 1 and 3: delay and backoff on Encore Pub/Sub); ADR 0140 (envelope and kinds);
 *                     ADR 0328 (built with `create`).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * A broker delivered a job before it was due.
 *
 * @example
 * throw JobNotDueError.create({ runAt: job.runAt.toISOString() });
 */
export class JobNotDueError extends Refusal({
  kind: ErrorKind.Unavailable,
  retryable: true,
}) {
  /** When the job is due, as ISO 8601. */
  runAt!: string;
}
