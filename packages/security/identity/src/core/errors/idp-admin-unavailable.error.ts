/**
 * Stackra file contract:
 * Purpose: `IdpAdminUnavailableError`, the identity provider's admin API could not be reached, timed out, throttled the
 *          call or failed on its side (`idp_admin_unavailable`).
 * Boundary: kind `Unavailable`, retryable true. It carries no details: never a response body, a token or a person's
 *           data; the HTTP status rides in its cause's message.
 * Runtime: isomorphic
 * Governing contract: ADR 0140; ADR 0410 (STA-834).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * The refusal when the identity provider's admin API is unreachable, slow, throttling or failing.
 *
 * @example
 * throw IdpAdminUnavailableError.create({}, { cause });
 */
export class IdpAdminUnavailableError extends Refusal({
  kind: ErrorKind.Unavailable,
  retryable: true,
}) {}
