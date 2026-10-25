/**
 * Stackra file contract:
 * Purpose: `gtinCheckDigit(body)`, the GS1 mod 10 check digit of a GTIN body (the digits before the check digit), the
 *          same for GTIN-8, -12 (UPC-A), -13 (EAN-13) and -14.
 * Boundary: pure. Weights 3 and 1 alternate from the rightmost body digit. This package owns GTIN check digits
 *           (conflict #1); `@stackra/support` keeps GS1 allocation and Code 128.
 * Runtime: isomorphic
 * Governing contract: GS1 General Specifications (check digit calculation); conflict #1; COM-78; ADR 0305.
 */

/**
 * The check digit of `body`.
 *
 * @throws RangeError when `body` is not 7 to 17 digits.
 * @example
 * gtinCheckDigit("400638133393"); // 1, so the EAN-13 is 4006381333931
 */
export function gtinCheckDigit(body: string): number {
  if (!/^\d{7,17}$/.test(body))
    throw new RangeError(`gtinCheckDigit: "${body}" is not a GTIN body of 7 to 17 digits`);
  let sum = 0;
  for (const [index, digit] of [...body].reverse().entries())
    sum += Number(digit) * (index % 2 === 0 ? 3 : 1);
  return (10 - (sum % 10)) % 10;
}
