/**
 * Stackra file contract:
 * Purpose: `formatNumber(value, tag, options, numerals)`, a number formatted in `tag` and written in `numerals` (by
 *          default the tag's own `-u-nu-` keyword), on every engine.
 * Boundary: pure apart from Intl; `numberFormatIn` does the work.
 * Runtime: isomorphic
 * Governing contract: ADR 0192 (decision 2, as amended 2026-10-28).
 */
import type { NumberingSystem } from "#core/enums/numbering-system.enum";
import { numberFormatIn } from "#core/functions/number-format-in.function";
import { numeralsOf } from "#core/functions/numerals-of.function";

/**
 * `value` formatted in `tag`, in `numerals`.
 *
 * @example
 * formatNumber(1310, "en-u-nu-latn"); // "1,310"
 * formatNumber(1310.5, "ar-u-nu-arab"); // "١٬٣١٠٫٥"
 */
export function formatNumber(
  value: number | bigint,
  tag: string,
  options?: Intl.NumberFormatOptions,
  numerals: NumberingSystem = numeralsOf(tag),
): string {
  return numberFormatIn(tag, options, numerals).format(value);
}
