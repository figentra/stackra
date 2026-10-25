/**
 * Stackra file contract:
 * Purpose: `shiftDecimal`, a decimal times a power of ten, exact (`shiftDecimal("3.75", 2)` is `"375"`,
 *          `shiftDecimal("3.75", -1)` is `"0.375"`): how a major-unit rate becomes a minor-unit factor for currencies
 *          whose exponents differ (USD 2, KWD 3, JPY 0).
 * Boundary: internal; pure.
 * Runtime: isomorphic
 * Governing contract: ADR 0220 (decision 2: the ISO 4217 exponent).
 */
import { decimalParts } from "#core/functions/decimal-parts.function";
import { formatDecimal } from "#core/functions/format-decimal.function";

/**
 * `decimal × 10^places`.
 *
 * @example
 * shiftDecimal("0.000123", 2); // "0.0123"
 * @throws RangeError when `decimal` is not a plain decimal.
 */
export function shiftDecimal(decimal: string, places: number): string {
  const { digits, scale } = decimalParts(decimal);
  const shifted = scale - places;
  return shifted >= 0
    ? formatDecimal({ digits, scale: shifted })
    : formatDecimal({ digits: digits * 10n ** BigInt(-shifted), scale: 0 });
}
