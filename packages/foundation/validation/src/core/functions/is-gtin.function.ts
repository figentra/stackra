/**
 * Stackra file contract:
 * Purpose: `isGtin(value)`, whether a value is a GTIN-8, GTIN-12 (UPC-A), GTIN-13 (EAN-13) or GTIN-14 with a correct
 *          check digit.
 * Boundary: pure; digits only, no spaces. A GTIN's meaning (its company prefix, a restricted range) is not checked.
 * Runtime: isomorphic
 * Governing contract: GS1 General Specifications; conflict #1; COM-78; ADR 0305.
 */
import { gtinCheckDigit } from "#core/functions/gtin-check-digit.function";

/**
 * Whether `value` is a GTIN.
 *
 * @example
 * isGtin("4006381333931"); // true
 * isGtin("4006381333932"); // false
 */
export function isGtin(value: string): boolean {
  if (!/^(?:\d{8}|\d{12}|\d{13}|\d{14})$/.test(value)) return false;
  return gtinCheckDigit(value.slice(0, -1)) === Number(value.slice(-1));
}
