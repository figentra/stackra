/**
 * Stackra file contract:
 * Purpose: `EAN13_L_CODES`, the seven-module left-hand odd-parity ("L") pattern of each digit 0–9; the right-hand set
 *          ("R") is the L pattern inverted and the even set ("G") is the R pattern reversed.
 * Boundary: data only; read by `ean13ModulesOf`.
 * Runtime: isomorphic
 * Governing contract: ISO/IEC 15420 (EAN/UPC); STA-1371 (wave D, owner approval 2026-10-30).
 */

/** "1" is a bar module, "0" a space. */
export const EAN13_L_CODES: readonly string[] = Object.freeze([
  "0001101",
  "0011001",
  "0010011",
  "0111101",
  "0100011",
  "0110001",
  "0101111",
  "0111011",
  "0110111",
  "0001011",
]);
