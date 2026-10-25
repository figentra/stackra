/**
 * Stackra file contract:
 * Purpose: `sha256`, the SHA-256 digest of text (as UTF-8) or bytes, through Web Crypto.
 * Boundary: a pure async function; no dependency, so it runs on a till, in a browser and on a server alike.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decision 3).
 */

/**
 * The 32-byte digest.
 *
 * @example
 * toHex(await sha256("abc")); // "ba7816bf…"
 */
export async function sha256(input: string | Uint8Array): Promise<Uint8Array> {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  return new Uint8Array(await globalThis.crypto.subtle.digest("SHA-256", bytes));
}
