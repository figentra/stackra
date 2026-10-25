/**
 * Stackra file contract:
 * Purpose: `WorkflowError`, how a run or a step failed, as the journal keeps it: the refusal code (`internal` for any
 *          other error) and the message.
 * Boundary: a type only; never a stack and never the step's input.
 * Runtime: isomorphic
 * Governing contract: ADR 0137 (refusal codes); ADR 0140 (the error envelope's code).
 */

/** A recorded failure. */
export interface WorkflowError {
  /** The refusal's code (`card_declined`, `workflow_timed_out`), or `internal` for an error that is not a refusal. */
  readonly code: string;

  /** The error's message. */
  readonly message: string;
}
