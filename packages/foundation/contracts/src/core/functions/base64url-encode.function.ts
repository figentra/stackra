/**
 * Stackra file contract:
 * Purpose: `base64urlEncode`, bytes as base64url without padding (RFC 4648 section 5): the text form of a sealed
 *          field's parts, a wrapped data key and a detached signature.
 * Boundary: internal to the package; pure, `btoa` only, so it runs in Node, a browser and a worker.
 * Runtime: isomorphic
 * Governing contract: ADR 0188 (decision 2); ADR 0415; ADR 0416.
 */

/**
 * `bytes` as base64url without padding.
 *
 * @example
 * base64urlEncode(new Uint8Array([251, 255])); // "-_8"
 */
export function base64urlEncode(bytes: Uint8Array): string {
  let text = "";
  for (const byte of bytes) text += String.fromCharCode(byte);
  return btoa(text).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}
