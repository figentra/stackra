/**
 * Stackra file contract:
 * Purpose: `mod97Valid(value)`, the ISO 7064 mod 97-10 check of an IBAN-shaped value: the first four characters move
 *          to the end, letters become 10 to 35, and the number modulo 97 must be 1.
 * Boundary: pure; upper-case letters and digits only (anything else is invalid). Computed piecewise, so no big number
 *           is built. Internal to `checkIdentifier`; the per-country length and layout are the format's pattern.
 * Runtime: isomorphic
 * Governing contract: ISO 13616 (IBAN); ISO 7064; ADR 0305.
 */

/**
 * Whether `value` passes mod 97-10.
 *
 * @example
 * mod97Valid("GB82WEST12345698765432"); // true
 */
export function mod97Valid(value: string): boolean {
  if (!/^[A-Z]{2}\d{2}[0-9A-Z]+$/.test(value)) return false;
  const moved = `${value.slice(4)}${value.slice(0, 4)}`;
  let remainder = 0;
  for (const char of moved) {
    const code = char >= "A" ? String(char.charCodeAt(0) - 55) : char;
    for (const digit of code) remainder = (remainder * 10 + Number(digit)) % 97;
  }
  return remainder === 1;
}
