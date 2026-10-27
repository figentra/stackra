/**
 * Stackra file contract:
 * Purpose: `IdpUserExistsError`, the identity provider already has a user with that login name in the organisation
 *          (`idp_user_exists`).
 * Boundary: kind `Conflict`, retryable false. It never names the user or the existing record.
 * Runtime: isomorphic
 * Governing contract: ADR 0140; ADR 0410 (STA-834).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * The refusal when the identity provider already has a user with that login name in the organisation.
 *
 * @example
 * throw IdpUserExistsError.create();
 */
export class IdpUserExistsError extends Refusal({
  kind: ErrorKind.Conflict,
  retryable: false,
}) {}
