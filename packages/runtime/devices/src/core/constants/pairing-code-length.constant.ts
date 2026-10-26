/**
 * Stackra file contract:
 * Purpose: `PAIRING_CODE_LENGTH`, how many characters a pairing code has.
 * Boundary: data only; mechanism; internal, not on any entry. Eight characters of 31 give about 40 bits, and a code is
 *           single use and short-lived.
 * Runtime: isomorphic
 * Governing contract: ADR 0361 (decision 7: pairing).
 */

/** How many characters a pairing code has. */
export const PAIRING_CODE_LENGTH = 8;
