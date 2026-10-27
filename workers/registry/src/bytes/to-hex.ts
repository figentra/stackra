/**
 * Stackra file contract:
 * Purpose: `toHex`: bytes to lower-case hex.
 * Boundary: pure Web Crypto; no I/O.
 * Runtime: Cloudflare Workers
 * Governing contract: ADR 0453 (decision 8).
 */

/** Bytes to lower-case hex. */
export function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}
