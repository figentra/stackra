/**
 * Stackra file contract:
 * Purpose: `decodeBase64`, the bytes of a Base64 text, or `undefined` when it is not Base64.
 * Boundary: internal; reads a `whsec_` secret and each `v1,` signature of a `webhook-signature` header. Never throws,
 *           so a malformed signature counts as a signature that does not match.
 * Runtime: isomorphic
 * Governing contract: the Standard Webhooks specification.
 */

/**
 * The decoded bytes.
 *
 * @example
 * decodeBase64("dXNlcjpwYXNz"); // the bytes of "user:pass"
 * decodeBase64("not base64!"); // undefined
 */
export function decodeBase64(text: string): Uint8Array<ArrayBuffer> | undefined {
  try {
    return Uint8Array.from(atob(text), (character) => character.charCodeAt(0));
  } catch {
    return undefined;
  }
}
