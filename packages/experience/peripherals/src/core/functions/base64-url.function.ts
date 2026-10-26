/**
 * Stackra file contract:
 * Purpose: `base64Url(bytes)`, bytes as unpadded base64url text, the encoding of a receipt token's two parts.
 * Boundary: internal; pure. Uses `btoa`, present in browsers, workers, Node and Hermes.
 * Runtime: isomorphic
 * Governing contract: ADR 0429 (decision 2); RFC 4648 section 5.
 */

/**
 * Encodes `bytes` as base64url without padding.
 *
 * @example
 * base64Url(new Uint8Array([251, 255])); // "-_8"
 */
export function base64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}
