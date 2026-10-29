/**
 * Stackra file contract:
 * Purpose: `IdpSessionGrant`, the identity provider's session a passed passkey check leaves: its id and the token
 *          that proves it.
 * Boundary: a type only. The token is a bearer credential for the provider's session: the host's BFF turns it into
 *           its own session (finishing the OIDC auth request), and nothing logs or stores it.
 * Runtime: isomorphic
 * Governing contract: ADR 0206 (decisions 7 and 8); STA-1538.
 */

/** A verified provider session. */
export interface IdpSessionGrant {
  /** The provider's session id. */
  readonly sessionId: string;

  /** The provider's session token; a secret. */
  readonly sessionToken: string;
}
