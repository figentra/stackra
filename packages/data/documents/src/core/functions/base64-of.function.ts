/**
 * Stackra file contract:
 * Purpose: `base64Of`, base64 of a byte array, and the inverse used to read `Packer.toBase64String`.
 * Boundary: internal to this package (inline `data:` images, DOCX bytes); not exported from the entry. A loop, because
 *           spreading a large image into `String.fromCharCode` overflows the call stack.
 * Runtime: isomorphic
 * Governing contract: ADR 0365 (decision 2).
 */

/** `bytes` as base64. */
export function base64Of(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCodePoint(byte);
  return btoa(binary);
}
