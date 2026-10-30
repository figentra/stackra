/**
 * Stackra file contract:
 * Purpose: `formatLength(length, unit, options)`, a length shown in the unit the Market or user chose, converted
 *          exactly from the stored `Quantity` and formatted by Intl with the unit's localised symbol and the
 *          configured digits.
 * Boundary: pure apart from Intl. The conversion is `@stackra/support`'s `Quantity` (exact); the rounding is
 *           `places`, applied once before Intl sees the number. The unit is the caller's (pack data or the user's setting).
 * Runtime: isomorphic
 * Governing contract: row "length units" of the package needs (2026-10-25); ADR 0192 (decision 2: digits).
 */
import { Enum } from "@stackra/contracts";
import type { Quantity } from "@stackra/support";

import { LengthUnit } from "#core/enums/length-unit.enum";
import type { NumberingSystem } from "#core/enums/numbering-system.enum";
import { intlLocale } from "#core/functions/intl-locale.function";
import { numberFormatIn } from "#core/functions/number-format-in.function";

/**
 * `length` in `unit`, formatted for `options.locale`.
 *
 * @throws TypeError when `length` is not a length.
 * @example
 * formatLength(Quantity.of(100, "cm"), LengthUnit.In, { locale: "en", numerals: NumberingSystem.Latn, places: 1 });
 * // "39.4 in"
 */
export function formatLength(
  length: Quantity,
  unit: LengthUnit,
  options: { readonly locale: string; readonly numerals: NumberingSystem; readonly places: number },
): string {
  const converted = length.to(unit).toDecimal(options.places);
  return numberFormatIn(
    intlLocale(options.locale, options.numerals),
    {
      style: "unit",
      unit: Enum.meta(LengthUnit, unit).intl,
      minimumFractionDigits: options.places,
      maximumFractionDigits: options.places,
    },
    options.numerals,
  ).format(Number(converted));
}
