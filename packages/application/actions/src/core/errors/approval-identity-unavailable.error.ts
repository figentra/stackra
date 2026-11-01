/**
 * Stackra file contract:
 * Purpose: `ApprovalIdentityUnavailableError` (`approval_identity_unavailable`), the refusal when identity could not answer a person, active or delegation check of the approval stage, so the vote or the call is refused (fail closed, N5).
 * Boundary: Kind `Unavailable` (503), retryable. Never a pass: at execution the request stays `executing` for the retry.
 * Runtime: isomorphic
 * Governing contract: ADR 0509 (refusals); ADR 0140 (envelope and kinds); STA-1724 FR-009.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * Identity could not answer an approval check.
 *
 * @example
 * throw ApprovalIdentityUnavailableError.create();
 */
export class ApprovalIdentityUnavailableError extends Refusal({
  kind: ErrorKind.Unavailable,
  retryable: true,
}) {}
