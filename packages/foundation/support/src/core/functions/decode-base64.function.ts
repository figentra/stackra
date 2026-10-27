/**
 * Stackra file contract:
 * Purpose: `decodeBase64`, the bytes of a standard Base64 text (padding required, whitespace and line breaks
 *          ignored), or `undefined` when it is not Base64: webhook secrets and signatures, licence file parts.
 * Boundary: public and pure; built on `atob` (Node, browsers, workers). Never throws, so a malformed signature counts
 *           as one that does not match and a caller that must refuse says why itself. Base64url is `base64url`.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); RFC 4648 section 4; stackra-224 (one copy, was webhooks
 *                     and licensing).
 */

/**
 * The decoded bytes, or `undefined` when `text` is not Base64.
 *
 * @example
 * decodeBase64("aGk="); // Uint8Array [104, 105]
 * decodeBase64("not base64!"); // undefined
 */
export function decodeBase64(text: string): Uint8Array<ArrayBuffer> | undefined {
  try {
    return Uint8Array.from(atob(text.replace(/\s+/g, "")), (character) => character.charCodeAt(0));
  } catch {
    return undefined;
  }
}
