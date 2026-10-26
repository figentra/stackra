/**
 * Stackra file contract:
 * Purpose: `PAIRING_CODE_ALPHABET`, the characters a pairing code is drawn from: upper-case letters and digits without
 *          the ones people misread (`0`/`O`, `1`/`I`/`L`), so a code read off a till's screen is typed right.
 * Boundary: data only; mechanism. `PAIRING_CODE_ALPHABET` is public on `.`; the length stays internal. Eight characters of 31 give about 40 bits, and a code is single use and short-lived.
 * Runtime: isomorphic
 * Governing contract: ADR 0361 (decision 7: pairing).
 */

/** The 31 characters of a pairing code. */
export const PAIRING_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** How many characters a pairing code has. */
export const PAIRING_CODE_LENGTH = 8;
