/**
 * Stackra file contract:
 * Purpose: `fromBase64Url(text)`, unpadded base64url text back to bytes, or `null` when it is not base64url.
 * Boundary: internal; pure. Uses `atob`, present in browsers, workers, Node and Hermes.
 * Runtime: isomorphic
 * Governing contract: ADR 0429 (decision 2); RFC 4648 section 5.
 */

/** Unpadded base64url. */
const BASE64_URL = /^[A-Za-z0-9_-]*$/;

/**
 * Decodes base64url text.
 *
 * @example
 * fromBase64Url("-_8"); // Uint8Array [251, 255]
 */
export function fromBase64Url(text: string): Uint8Array<ArrayBuffer> | null {
  if (!BASE64_URL.test(text) || text.length % 4 === 1) return null;
  const binary = atob(text.replaceAll("-", "+").replaceAll("_", "/"));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}
