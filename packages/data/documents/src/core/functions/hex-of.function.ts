/**
 * Stackra file contract:
 * Purpose: `hexOf`, lower-case hexadecimal of a byte array.
 * Boundary: internal to this package (content hashes); not exported from the entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0365 (decision 4).
 */

/** `bytes` as lower-case hex. */
export function hexOf(bytes: Uint8Array): string {
  let hex = "";
  for (const byte of bytes) hex += byte.toString(16).padStart(2, "0");
  return hex;
}
