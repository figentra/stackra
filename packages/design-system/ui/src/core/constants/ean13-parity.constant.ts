/**
 * Stackra file contract:
 * Purpose: `EAN13_PARITY`, which of the six left-hand digits use the odd (L) or even (G) set, chosen by the first
 *          digit, which is never drawn as bars itself.
 * Boundary: data only; read by `ean13ModulesOf`.
 * Runtime: isomorphic
 * Governing contract: ISO/IEC 15420 (EAN/UPC); STA-1371 (wave D, owner approval 2026-10-30).
 */

/** Indexed by the first digit. */
export const EAN13_PARITY: readonly string[] = Object.freeze([
  "LLLLLL",
  "LLGLGG",
  "LLGGLG",
  "LLGGGL",
  "LGLLGG",
  "LGGLLG",
  "LGGGLL",
  "LGLGLG",
  "LGLGGL",
  "LGGLGL",
]);
