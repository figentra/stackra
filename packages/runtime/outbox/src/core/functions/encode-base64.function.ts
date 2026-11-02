/**
 * Stackra file contract:
 * Purpose: `encodeBase64`, standard padded base64 of bytes, the form of a Standard Webhooks signature value.
 * Boundary: internal and isomorphic (`btoa`).
 * Runtime: isomorphic
 * Governing contract: ADR 0511 (decision 16, amendment of 2026-11-02).
 */

/**
 * The base64 text of `bytes`.
 *
 * @example
 * encodeBase64(new Uint8Array([0, 1])); // "AAE="
 */
export function encodeBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCodePoint(byte);
  return btoa(binary);
}
