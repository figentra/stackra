/**
 * Stackra file contract:
 * Purpose: `base64UrlOf(bytes)`, the unpadded base64url text of bytes (RFC 4648 section 5), the encoding of a PKCE
 *          verifier, its challenge, a state and a nonce.
 * Boundary: internal; a pure function over `btoa`, which browsers, Node and Hermes all have.
 * Runtime: isomorphic
 * Governing contract: RFC 7636 (section 4); ADR 0206 (decision 8).
 */

/**
 * The base64url text of `bytes`, without padding.
 *
 * @example
 * base64UrlOf(new Uint8Array([251, 255])); // "-_8"
 */
export function base64UrlOf(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}
