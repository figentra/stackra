/**
 * Stackra file contract:
 * Purpose: `TokenSource`, how `bearerToken` gets the access token: asked once per request, so a refreshed token is
 *          used at once.
 * Boundary: a type only. The token is never stored by the transport.
 * Runtime: isomorphic
 * Governing contract: ADR 0206 (identity provider tokens); ADR 0173 (nobody keeps a secret value).
 */

/** The current access token, or `undefined` when signed out. */
export type TokenSource = () => string | undefined | Promise<string | undefined>;
