/**
 * Stackra file contract:
 * Purpose: `currencyScale(currency)`, the minor units in one major unit of a currency, or undefined when the text is no
 *          currency code (a money field then stays in minor units rather than scale by a guess).
 * Boundary: internal: pure; wraps `minorUnitScale`, which throws on an unknown code.
 * Runtime: isomorphic
 * Governing contract: ADR 0220 (money in minor units).
 */
import { minorUnitScale } from "#core/functions/minor-unit-scale.function";

/**
 * The scale of `currency`, or undefined.
 *
 * @example
 * currencyScale("AED"); // 100
 */
export function currencyScale(currency: string | undefined): number | undefined {
  if (currency === undefined) return undefined;
  try {
    return minorUnitScale(currency);
  } catch {
    return undefined;
  }
}
