/**
 * Stackra file contract:
 * Purpose: `newPairingSecret`, the secret a device mints when it opens a pairing: 32 bytes from the platform's
 *          cryptographic random source, as 64 hex characters. The device sends it in the body when it opens the
 *          pairing and again when it picks up its credential, so the pairing id alone never yields the credential.
 * Boundary: internal to the package (the pairing driver's). Reads `globalThis.crypto`, present in Node 20+, browsers and
 *           Hermes with the polyfill. The hub stores only its hash.
 * Runtime: isomorphic
 * Governing contract: ADR 0361 (decision 7: pairing); ADR 0235 (decision 1, as amended).
 */

/** Bytes of entropy: 256 bits. */
const BYTES = 32;

/**
 * A new pairing secret.
 *
 * @example
 * newPairingSecret(); // "9f2c…" (64 hex characters)
 */
export function newPairingSecret(): string {
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(BYTES));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}
