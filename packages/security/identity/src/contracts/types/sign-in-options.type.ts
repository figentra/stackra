/**
 * Stackra file contract:
 * Purpose: `SignInOptions`, what one sign-in asks the provider beyond the configured scopes: extra scopes (an external
 *          identity provider hint), the authentication context, the longest age of the last authentication, and a
 *          forced re-authentication.
 * Boundary: a type only, OpenID Connect's own parameters, provider-neutral. `nationalSignIn` and `stepUpSignIn` build
 *           it from configuration; a `SessionStore` driver passes it to the hosted sign-in (the BFF forwards it).
 * Runtime: isomorphic
 * Governing contract: ADR 0206 (decisions 2 and 8); ADR 0207 (decision 1: step-up); owner round 3 #21 (national IdPs).
 */

/** The extras of one sign-in. */
export interface SignInOptions {
  /** Scopes added to the configured ones (an IdP hint scope). */
  readonly scopes?: readonly string[];

  /** `acr_values`: the authentication context classes asked for. */
  readonly acrValues?: readonly string[];

  /** `max_age` in seconds: re-authenticate when the last authentication is older. */
  readonly maxAge?: number;

  /** `prompt=login`: always re-authenticate. */
  readonly forceLogin?: boolean;
}
