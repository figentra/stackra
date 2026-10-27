/**
 * Stackra file contract:
 * Purpose: `DigestRequest`, what answering a SIP digest challenge needs besides the challenge: the request's method and
 *          URI, the trunk's user name and password, and the client nonce with its count.
 * Boundary: a type only. The password is read by secret name at each call and never kept or logged.
 * Runtime: node
 * Governing contract: RFC 3261 (section 22.4); RFC 7616 (section 3.4).
 */

/** What answering a challenge needs besides the challenge. */
export interface DigestRequest {
  /** The request method (`INVITE`, `REGISTER`). */
  readonly method: string;
  /** The Request-URI of the request being answered. */
  readonly uri: string;
  /** The trunk's user name. */
  readonly username: string;
  /** The trunk's password. */
  readonly password: string;
  /** A fresh client nonce. */
  readonly cnonce: string;
  /** How many times this nonce was used, 1 for the first. */
  readonly count?: number;
}
