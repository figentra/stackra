/**
 * Stackra file contract:
 * Purpose: `JobError`, what a stored job keeps of the failure of its last attempt: the machine code and the message.
 * Boundary: a type only. A refusal gives its snake_case code; any other error is `internal` with its message, so an
 *           operator reading a dead letter sees why without a stack or the input.
 * Runtime: isomorphic
 * Governing contract: ADR 0148 (decision 1); ADR 0140 (refusal codes); ADR 0231 (snake_case codes).
 */

/** The failure of a job's last attempt. */
export interface JobError {
  /** The refusal's code (`provider_unavailable`), or `internal` for any other error. */
  readonly code: string;

  /** The error's message. */
  readonly message: string;
}
