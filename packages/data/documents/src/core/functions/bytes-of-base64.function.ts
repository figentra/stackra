/**
 * Stackra file contract:
 * Purpose: `bytesOfBase64`, the bytes a base64 text holds.
 * Boundary: internal to this package (DOCX output); not exported from the entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0365 (decision 2).
 */

/** The bytes of the base64 `text`. */
export function bytesOfBase64(text: string): Uint8Array {
  const binary = atob(text);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}
