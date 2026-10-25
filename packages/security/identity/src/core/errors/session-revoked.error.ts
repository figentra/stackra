/**
 * Stackra file contract:
 * Purpose: `SessionRevokedError`, the refusal a `SessionStore` rejects with when the provider no longer honours the
 *          device's session (`session_revoked`): its refresh token was revoked from "Sessions" or outlived its lifetime.
 * Boundary: kind `Unauthenticated`, not retryable: only a new sign-in helps. It carries no details. The driver has
 *           already dropped its tokens when it throws; the `SessionService` turns it into `SessionStatus.Revoked`.
 * Runtime: isomorphic
 * Governing contract: ADR 0277 (decisions 4 and 5); ADR 0338 (decision 4); ADR 0140 (envelope and kinds); final review
 *                     R-02 (typed `create`).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * The provider refused the session.
 *
 * @example
 * if (answer.error === "invalid_grant") throw SessionRevokedError.create();
 */
export class SessionRevokedError extends Refusal({
  kind: ErrorKind.Unauthenticated,
  retryable: false,
}) {}
