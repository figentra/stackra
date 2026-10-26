/**
 * Stackra file contract:
 * Purpose: `newAwardCode`, a fresh short verify code as it is printed beside the QR code: 12 random Crockford base32
 *          characters (60 bits) in three groups of four (`7K3Q-9XPM-0ABZ`).
 * Boundary: node only (`node:crypto`). Each byte picks one of 32 characters (256 is a multiple of 32, so no bias). 60
 *           bits against the public area's rate limit make guessing a live code impractical; the code is a key, never
 *           a secret worth more than the certificate it prints on.
 * Runtime: node
 * Governing contract: ADR 0432 (decision 2).
 */
import { randomBytes } from "node:crypto";

import { AWARD_CODE_ALPHABET } from "#core/constants/award-code-alphabet.constant";

/**
 * A new code.
 *
 * @example
 * newAwardCode(); // "7K3Q-9XPM-0ABZ"
 */
export function newAwardCode(): string {
  const characters = [...randomBytes(12)].map((byte) => AWARD_CODE_ALPHABET.charAt(byte % 32));
  return [0, 4, 8].map((start) => characters.slice(start, start + 4).join("")).join("-");
}
