/**
 * Stackra file contract:
 * Purpose: `luhnValid(digits)`, the Luhn mod 10 check (ISO/IEC 7812-1) of a digit string whose last digit is the check
 *          digit.
 * Boundary: pure; digits only (anything else is invalid). Internal to `checkIdentifier`.
 * Runtime: isomorphic
 * Governing contract: ISO/IEC 7812-1; ADR 0305 (one declaration per file).
 */

/**
 * Whether `digits` passes Luhn.
 *
 * @example
 * luhnValid("79927398713"); // true
 */
export function luhnValid(digits: string): boolean {
  if (!/^\d{2,}$/.test(digits)) return false;
  let sum = 0;
  for (const [index, char] of [...digits].reverse().entries()) {
    const digit = Number(char);
    const doubled = index % 2 === 1 ? digit * 2 : digit;
    sum += doubled > 9 ? doubled - 9 : doubled;
  }
  return sum % 10 === 0;
}
