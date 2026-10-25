/**
 * Stackra file contract:
 * Purpose: `UnknownJobError`, the failure of a stored job whose key names no action this process registered: a job
 *          queued by a newer or older release than the worker that reserved it.
 * Boundary: raised by the worker, which dead-letters the job at once whatever the action declared (the class is not
 *           there to ask), so a redrive after the right release runs it. Kind `Internal`, not retryable, code
 *           `unknown_job`; the one detail is the stored key.
 * Runtime: isomorphic
 * Governing contract: ADR 0148 (decision 1: the dead-letter queue with replay); ADR 0140 (envelope and kinds);
 *                     ADR 0328 (built with `create`).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * A job names an action this process does not know.
 *
 * @example
 * throw UnknownJobError.create({ key: "messages.message.deliver@1" });
 */
export class UnknownJobError extends Refusal({ kind: ErrorKind.Internal, retryable: false }) {
  /** The action key the job was stored with. */
  key!: string;
}
