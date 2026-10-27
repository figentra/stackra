/**
 * Stackra file contract:
 * Purpose: `AppApprovalRejectedError`, an app approval step that cannot go ahead (`app_approval_rejected`): the
 *          challenge is unknown, lapsed, already answered or not this principal's, the approving device holds no
 *          credential bound to the principal, the QR token was already used, or the requester completes a challenge
 *          that was not approved.
 * Boundary: kind `Unauthenticated`, retryable false. One refusal for every cause on purpose: it never says whether
 *           an account exists, or which check failed.
 * Runtime: isomorphic
 * Governing contract: STA-1304 (owner request 2026-10-27); ADR 0140.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * The refusal for an app approval step that cannot go ahead: unknown, lapsed, answered or foreign challenge.
 *
 * @example
 * throw AppApprovalRejectedError.create();
 */
export class AppApprovalRejectedError extends Refusal({
  kind: ErrorKind.Unauthenticated,
  retryable: false,
}) {}
