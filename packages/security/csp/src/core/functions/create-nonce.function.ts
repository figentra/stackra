/**
 * Stackra file contract:
 * Purpose: `createNonce`, a fresh CSP nonce for one request: 128 bits from `crypto.getRandomValues`, base64.
 * Boundary: mints only; the server middleware calls it once per request before anything renders and passes the same
 *           value to the header (`contentSecurityPolicy`) and the render (`NonceProvider`). Never reused, never
 *           cached, never derived from the request. Uses the Web Crypto global, so it runs on Workers, Node and the
 *           browser alike.
 * Runtime: isomorphic
 * Governing contract: ADR 0237 (edge headers).
 */

/**
 * A new nonce.
 *
 * @example
 * const nonce = createNonce(); // "q2Xr0f8bT1k1m3c5H0pW9A=="
 */
export function createNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCodePoint(...bytes));
}
