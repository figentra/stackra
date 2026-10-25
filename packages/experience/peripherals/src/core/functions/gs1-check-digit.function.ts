/**
 * Stackra file contract:
 * Purpose: `gs1CheckDigit`, the GS1 modulo-10 check digit of the digits before it (weights 3 and 1 from the right), so
 *          a misread EAN-13 or UPC-A is refused before its value is trusted.
 * Boundary: internal; pure. The digits are already checked to be digits.
 * Runtime: isomorphic
 * Governing contract: the COM-241 answer; ADR 0339.
 */

/**
 * The check digit `body` needs.
 *
 * @example
 * gs1CheckDigit("211234501250"); // 6
 */
// shortcut: a local GS1 check while @stackra/validation has no GTIN check (conflict #1 puts it there); switch to it once
// it ships.
export function gs1CheckDigit(body: string): number {
  let sum = 0;
  for (let index = 0; index < body.length; index += 1) {
    const digit = Number(body[body.length - 1 - index]);
    sum += index % 2 === 0 ? digit * 3 : digit;
  }
  return (10 - (sum % 10)) % 10;
}
