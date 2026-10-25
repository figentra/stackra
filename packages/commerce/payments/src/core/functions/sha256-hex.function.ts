/**
 * Stackra file contract:
 * Purpose: `sha256Hex`, the lowercase hex SHA-256 of a UTF-8 string, for providers that sign requests with a hash of
 *          their fields and a shared key.
 * Boundary: Web Crypto only (`crypto.subtle`), present in Node and browsers. The input may hold a secret; it is never
 *           logged or returned.
 * Runtime: isomorphic
 * Governing contract: ADR 0357 (decision 5).
 */

/**
 * The digest as 64 hex characters.
 *
 * @example
 * const signature = await sha256Hex(`${merchantCode}${reference}${secureKey}`);
 */
export async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
