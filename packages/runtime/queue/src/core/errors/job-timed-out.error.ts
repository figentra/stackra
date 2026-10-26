/**
 * Stackra file contract:
 * Purpose: `JobTimedOutError`, the failure of a job attempt that ran past its timeout (the `job.timeout` option, five
 *          minutes when absent).
 * Boundary: raised by the worker, never by an action: the attempt's abort signal fires and the attempt counts as failed.
 *           Kind `Unavailable`, retryable, code `job_timed_out`; the one detail is the timeout, as an ISO 8601 duration.
 *           The worker cannot stop code that ignores the signal, so a handler that loops checks
 *           `ctx.abortSignal`.
 * Runtime: isomorphic
 * Governing contract: ADR 0148 (decision 1: timeouts); ADR 0140 (envelope and kinds); ADR 0328 (built with `create`).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * A job attempt ran out of time.
 *
 * @example
 * throw JobTimedOutError.create({ timeout: "PT5M" });
 */
export class JobTimedOutError extends Refusal({
  kind: ErrorKind.Unavailable,
  retryable: true,
}) {
  /** The timeout the attempt ran past, as an ISO 8601 duration (`PT5M`). */
  timeout!: string;
}
