/**
 * Stackra file contract:
 * Purpose: `randomToken()`, an unguessable base64url token from 32 random bytes: a PKCE code verifier (43 characters,
 *          inside RFC 7636's 43 to 128), a state or a nonce.
 * Boundary: internal; reads `crypto.getRandomValues`, never `Math.random`.
 * Runtime: isomorphic
 * Governing contract: RFC 7636 (section 4.1); OpenID Connect Core (nonce); ADR 0206 (decision 8).
 */
import { base64UrlOf } from "#core/functions/base64-url-of.function";

/**
 * A fresh 43-character token.
 *
 * @example
 * const verifier = randomToken();
 */
export function randomToken(): string {
  return base64UrlOf(crypto.getRandomValues(new Uint8Array(32)));
}
