/**
 * Stackra file contract:
 * Purpose: `WorkflowTimedOutError`, the core refusal when a workflow waited past its step deadline and compensated what
 *          it had done.
 * Boundary: a core refusal: raised by the workflow runtime, when a step's wait expires; the action that started the
 *           workflow refuses with it. Kind `Unavailable`, code `workflow_timed_out`, no details, so nothing about the
 *           refused call travels with it.
 * Runtime: isomorphic
 * Governing contract: ADR 0140 (envelope and kinds), ADR 0294 (decisions 16 and 20), ADR 0140
 */
import { Refusal } from "#core/bases/refusal.base";
import { ErrorKind } from "#core/enums/error-kind.enum";

/** Retryable: the workflow undid its steps, so starting it again is safe. */
export class WorkflowTimedOutError extends Refusal({
  kind: ErrorKind.Unavailable,
  retryable: true,
}) {}
