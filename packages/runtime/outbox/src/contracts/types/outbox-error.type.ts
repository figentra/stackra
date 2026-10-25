/**
 * Stackra file contract:
 * Purpose: `OutboxError`, what a stored message keeps of its last failed delivery: the machine code and the message.
 * Boundary: a type only. A refusal gives its snake_case code; any other error is `internal` with its message, so an
 *           operator reading a dead message sees why without a stack or the payload.
 * Runtime: isomorphic
 * Governing contract: ADR 0140 (refusal codes); ADR 0231 (snake_case codes).
 */

/** The failure of a message's last delivery. */
export interface OutboxError {
  /** The refusal's code (`unknown_event`), or `internal` for any other error. */
  readonly code: string;

  /** The error's message. */
  readonly message: string;
}
