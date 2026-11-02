/**
 * Stackra file contract:
 * Purpose: `decodeBase64`, the bytes of a base64 or base64url text (padding optional), for the cross-app keys and
 *          signatures.
 * Boundary: internal and isomorphic (`atob`); throws on a text that is not base64, which a verifier reads as a bad key
 *           or signature.
 * Runtime: isomorphic
 * Governing contract: ADR 0511 (decision 16, amendment of 2026-11-02).
 */

/**
 * The bytes of `text`.
 *
 * @throws DOMException when `text` is not base64.
 * @example
 * decodeBase64("AAE"); // Uint8Array [0, 1]
 */
export function decodeBase64(text: string): Uint8Array<ArrayBuffer> {
  const binary = atob(text.replaceAll("-", "+").replaceAll("_", "/"));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1)
    bytes[index] = binary.codePointAt(index) ?? 0;
  return bytes;
}
