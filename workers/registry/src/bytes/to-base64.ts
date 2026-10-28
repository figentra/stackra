/**
 * Stackra file contract:
 * Purpose: `toBase64`: bytes to base64.
 * Boundary: pure Web Crypto; no I/O.
 * Runtime: worker
 * Governing contract: ADR 0453 (decision 8).
 */

/** Bytes to base64. */
export function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let at = 0; at < bytes.length; at += 0x8000)
    binary += String.fromCodePoint(...bytes.subarray(at, at + 0x8000));
  return btoa(binary);
}
