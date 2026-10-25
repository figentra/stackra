/**
 * Stackra file contract:
 * Purpose: `decimalProduct`, the exact product of decimals as a decimal string: a formula price multiplies a weight, a
 *          purity and a rate (`decimalProduct(12.5, 0.875)` is `"10.9375"`) with no float error, then rounds once
 *          through `Money#times`.
 * Boundary: pure. Numbers are read as the decimals they print as and strings as written; nothing is rounded here.
 *           Refusals are `RangeError`s (a non-finite number, a string that is not a decimal, no factor).
 * Runtime: isomorphic
 * Governing contract: ADR 0220 (decision 3: exact arithmetic, one explicit rounding).
 */
import { decimalParts } from "#core/functions/decimal-parts.function";
import { formatDecimal } from "#core/functions/format-decimal.function";

/**
 * The product of `factors`, exact.
 *
 * @example
 * decimalProduct(12.5, "0.875", "251.42"); // "2749.90625"
 * @throws RangeError when no factor is given, or a factor is not finite or not a decimal.
 */
export function decimalProduct(...factors: readonly (number | string)[]): string {
  if (factors.length === 0) throw new RangeError("decimalProduct: give at least one factor");
  let digits = 1n;
  let scale = 0;
  for (const factor of factors) {
    const parts = decimalParts(factor);
    digits *= parts.digits;
    scale += parts.scale;
  }
  return formatDecimal({ digits, scale });
}
