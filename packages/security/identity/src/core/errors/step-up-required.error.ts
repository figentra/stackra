/**
 * Stackra file contract:
 * Purpose: `StepUpRequiredError`, a newer or stronger authentication is needed (`step_up_required`): the action asks for more assurance than
 *          the session's, or its last authentication is too old. The client starts `stepUpSignIn` and retries.
 * Boundary: kind `Unauthenticated`, retryable false. It never names another person or what a record holds.
 * Runtime: isomorphic
 * Governing contract: ADR 0207 (decision 1); ADR 0140 (envelope and kinds).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * The refusal when the action needs a newer or stronger authentication than the session's.
 *
 * @example
 * throw StepUpRequiredError.create({ required: AssuranceLevel.Aal2 });
 */
export class StepUpRequiredError extends Refusal({
  kind: ErrorKind.Unauthenticated,
  retryable: false,
}) {
  /** The assurance level the action needs (`aal2`). */
  required!: string;
}
