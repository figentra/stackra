/**
 * Stackra file contract:
 * Purpose: `JobIsolationMissingError`, the failure of a scoped job that reached a worker with no `CallIsolation`
 *          bound (`job_isolation_missing`): there is nothing to set its tenant, so it would read zero rows of every
 *          tenant-owned table as if that were the answer.
 * Boundary: raised by the worker for a job that has a `scope`; a job with none is a platform call and runs as before.
 *           Kind `FailedPrecondition`, not retryable, so the job is dead-lettered at once and a redrive after the
 *           isolation is bound runs it. It carries the stored key.
 * Runtime: isomorphic
 * Governing contract: ADR 0495 (decision 2 and the note of 2026-11-01); ADR 0148 (decision 1: the dead-letter queue
 *                     with replay); ADR 0140 (envelope and kinds).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * A scoped job has no isolation to run in.
 *
 * @example
 * throw JobIsolationMissingError.create({ key: "messages.message.deliver@1" });
 */
export class JobIsolationMissingError extends Refusal({
  kind: ErrorKind.FailedPrecondition,
  retryable: false,
}) {
  /** The action key the job was stored with. */
  key!: string;
}
