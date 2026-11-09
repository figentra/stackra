/**
 * Stackra file contract:
 * Purpose: `CallCredentials`, the credential headers of one inbound call as the generated Encore auth handler reads
 *          them: `Authorization` and `Stackra-On-Behalf-Of`.
 * Boundary: a type only; raw header values, never trusted until `CallAuthenticator` has verified them. Never logged.
 * Runtime: node
 * Governing contract: ADR 0209 (decision 3 and its 2026-11-07 amendment: the two tokens); ADR 0206 (decision 8).
 */

/** The credential headers of one call. */
export interface CallCredentials {
  /** The `Authorization` header as sent (`Bearer <token>`); absent when none was sent. */
  readonly authorization?: string;

  /** The `Stackra-On-Behalf-Of` header as sent: the user's own access token (the bare JWT) a service forwards. */
  readonly onBehalfOf?: string;
}
