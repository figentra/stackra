/**
 * Stackra file contract:
 * Purpose: `TokenRequest`, one call to an OAuth token endpoint as data: the endpoint, the grant's form fields, the
 *          client and how it authenticates, the provider code for refusals and the instant the request is sent.
 * Boundary: a type only. The endpoint and the client are data the caller reads from its own records (a connector row,
 *           an OAuth app), so a store host runs a code exchange or a refresh without an Integration class. The client
 *           secret and the tokens it buys are secrets (ADR 0308 rule 20).
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rules 6, 7 and 20); RFC 6749 (sections 2.3.1, 4.1.3, 4.4 and 6).
 */

/**
 * One token request.
 *
 * @example
 * const request: TokenRequest = {
 *   url: connector.tokenUrl,
 *   form: { grant_type: "authorization_code", code, redirect_uri: redirectUrl, code_verifier: verifier },
 *   clientId,
 *   clientSecret,
 *   provider: connector.provider,
 *   now: ctx.now(),
 * };
 */
export interface TokenRequest {
  /** The token endpoint. */
  readonly url: string;

  /** The grant's form fields (`grant_type`, `code`, `redirect_uri`, `code_verifier`, `refresh_token`, `scope`). */
  readonly form: Readonly<Record<string, string>>;

  /** The client id; none for a grant whose assertion names the client (JWT bearer). */
  readonly clientId?: string | undefined;

  /** The client secret; none for a public client. */
  readonly clientSecret?: string | undefined;

  /** How the client authenticates; `"basic"` when left out. */
  readonly authentication?: "basic" | "body";

  /** The provider's code, for the refusals. */
  readonly provider: string;

  /** When the request is sent, so `expires_in` becomes an instant. */
  readonly now: Date;
}
