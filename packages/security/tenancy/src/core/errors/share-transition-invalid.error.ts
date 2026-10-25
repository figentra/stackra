/**
 * Stackra file contract:
 * Purpose: `ShareTransitionInvalidError`, the refusal of a share change the share's state or the acting tenant does
 *          not allow (`share_transition_invalid`): accepting as the proposer, accepting a revoked share, releasing
 *          on a share that is not active, an item kind the share does not list.
 * Boundary: kind `FailedPrecondition`, not retryable, no details: it never describes the other tenant's side.
 * Runtime: isomorphic
 * Governing contract: ADR 0140 (envelope and kinds); ADR 0343 (decisions 1, 4 and 5).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * Not allowed in this state or by this tenant.
 *
 * @example
 * throw ShareTransitionInvalidError.create();
 */
export class ShareTransitionInvalidError extends Refusal({
  kind: ErrorKind.FailedPrecondition,
  retryable: false,
}) {}
