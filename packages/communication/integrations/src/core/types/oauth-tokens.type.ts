/**
 * Stackra file contract:
 * Purpose: `OAuthTokens`, what a token endpoint returns: the access token, the refresh token when there is one, and
 *          when the access token expires.
 * Boundary: a type only. Tokens are secrets: they live in the connection store (the store host's, encrypted, in
 *           hosted mode) and the managed client's memory, and never appear in a job, an event, a log, a trace, an
 *           error body or the browser (ADR 0308 rule 20).
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rules 7 and 20); RFC 6749 (section 5.1).
 */

/**
 * The tokens an OAuth exchange returns.
 *
 * @example
 * await store.connect(GoogleCalendarConnection, { level: ConnectionLevel.User, fields, tokens });
 */
export interface OAuthTokens {
  /** The bearer token sent with each call. */
  readonly accessToken: string;

  /** The token that renews the access token; absent when the provider gives none. */
  readonly refreshToken?: string;

  /** When the access token expires; absent when the provider does not say. */
  readonly expiresAt?: Date;
}
