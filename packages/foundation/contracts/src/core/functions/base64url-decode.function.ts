/**
 * Stackra file contract:
 * Purpose: `base64urlDecode`, base64url text (padded or not; plain base64 is read too) as bytes: the reverse of
 *          `base64urlEncode`.
 * Boundary: internal to the package; pure, `atob` only. Malformed text throws the `DOMException` of `atob`, which
 *           names no value.
 * Runtime: isomorphic
 * Governing contract: ADR 0188 (decision 2); ADR 0415; ADR 0416.
 */

/**
 * The bytes `text` encodes.
 *
 * @example
 * base64urlDecode("-_8"); // Uint8Array [251, 255]
 */
export function base64urlDecode(text: string): Uint8Array<ArrayBuffer> {
  const binary = atob(text.replaceAll("-", "+").replaceAll("_", "/"));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}
