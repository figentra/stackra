/**
 * Stackra file contract:
 * Purpose: `newPairingCode`, a fresh pairing code from `PAIRING_CODE_ALPHABET`, drawn with the platform's
 *          cryptographic random source and rejection sampling, so every character is equally likely.
 * Boundary: internal; reads `globalThis.crypto`, present in Node 20+, browsers and Hermes with the polyfill.
 * Runtime: isomorphic
 * Governing contract: ADR 0361 (decision 7: pairing).
 */
import {
  PAIRING_CODE_ALPHABET,
  PAIRING_CODE_LENGTH,
} from "#core/constants/pairing-code-alphabet.constant";

/** The largest byte value that keeps the draw unbiased: a multiple of the alphabet's size. */
const LIMIT = 256 - (256 % PAIRING_CODE_ALPHABET.length);

/**
 * A new pairing code.
 *
 * @example
 * newPairingCode(); // "K7Q4M2XR"
 */
export function newPairingCode(): string {
  let code = "";
  const bytes = new Uint8Array(PAIRING_CODE_LENGTH * 2);
  while (code.length < PAIRING_CODE_LENGTH) {
    globalThis.crypto.getRandomValues(bytes);
    for (const byte of bytes)
      if (byte < LIMIT && code.length < PAIRING_CODE_LENGTH)
        code += PAIRING_CODE_ALPHABET[byte % PAIRING_CODE_ALPHABET.length];
  }
  return code;
}
