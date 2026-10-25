/**
 * Stackra file contract:
 * Purpose: `codeChallengeOf(verifier)`, the `S256` code challenge of a PKCE verifier: the base64url text of its SHA-256.
 * Boundary: internal; reads `crypto.subtle`. `plain` is never sent.
 * Runtime: isomorphic
 * Governing contract: RFC 7636 (section 4.2); ADR 0206 (decision 8).
 */
import { base64UrlOf } from "#core/functions/base64-url-of.function";

/**
 * The challenge sent with the authorization request.
 *
 * @example
 * await codeChallengeOf("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"); // "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM"
 */
export async function codeChallengeOf(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return base64UrlOf(new Uint8Array(digest));
}
