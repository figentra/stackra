/**
 * Stackra file contract:
 * Purpose: `ean13CheckDigitOf(digits)`, the EAN-13 check digit of the first twelve digits: weights 1 and 3
 *          alternating from the left, then the step up to the next ten. `null` unless exactly twelve digits are given.
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: ISO/IEC 15420 (EAN/UPC); GS1 General Specifications 7.9.1; STA-1371 (wave D, owner approval
 *          2026-10-30).
 */

/** The check digit (0–9), or null for anything but twelve digits. */
export function ean13CheckDigitOf(digits: string): number | null {
  if (!/^\d{12}$/.test(digits)) return null;
  let sum = 0;
  for (let i = 0; i < 12; i += 1) sum += Number(digits[i]) * (i % 2 === 0 ? 1 : 3);
  return (10 - (sum % 10)) % 10;
}
