/**
 * Stackra file contract:
 * Purpose: `hashApiKey`, the SHA-256 of an API key's full text as 64 lowercase hex characters: what the identity
 *          service stores when it issues a key and what the gateway looks a presented key up by.
 * Boundary: pure apart from Web Crypto. Unsalted on purpose: a key carries 178 random bits, so no dictionary reaches
 *           it, and a deterministic hash is what lets the store find the record by an index. Never logs the key.
 * Runtime: isomorphic
 * Governing contract: ADR 0278 (decision 3); ADR 0410 (STA-835).
 */

/**
 * The stored hash of `key`.
 *
 * @example
 * await store.findByHash(await hashApiKey(header));
 */
export async function hashApiKey(key: string): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(key));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
