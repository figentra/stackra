/**
 * Stackra file contract:
 * Purpose: `formatQuantity(quantity, unit, options)`, a stored mass, length or volume shown in the unit the Market or
 *          user chose (imperial over metric storage, or the reverse), converted exactly from the `Quantity` and
 *          formatted by Intl with the unit's localised symbol, and the configured digits.
 * Boundary: pure apart from Intl. The conversion is `@stackra/support`'s `Quantity` (exact, refusing another
 *           dimension); the rounding is `places`, applied once before Intl sees the number. The unit is the caller's
 *           (pack data or the user's setting). `formatLength` stays for the length-only `LengthUnit`.
 * Runtime: isomorphic
 * Governing contract: ADR 0403 (imperial display over metric storage); ADR 0192 (decision 2: digits).
 */
import { Enum } from "@stackra/contracts";
import type { Quantity } from "@stackra/support";

import { DisplayUnit } from "#core/enums/display-unit.enum";
import type { NumberingSystem } from "#core/enums/numbering-system.enum";
import { intlLocale } from "#core/functions/intl-locale.function";

/**
 * `quantity` in `unit`, formatted for `options.locale`.
 *
 * @throws TypeError when `quantity` measures another dimension than `unit`.
 * @example
 * formatQuantity(Quantity.of(1000, "g"), DisplayUnit.Lb, { locale: "en-US", numerals: NumberingSystem.Latn, places: 2 });
 * // "2.20 lb"
 */
export function formatQuantity(
  quantity: Quantity,
  unit: DisplayUnit,
  options: { readonly locale: string; readonly numerals: NumberingSystem; readonly places: number },
): string {
  const converted = quantity.to(unit).toDecimal(options.places);
  return new Intl.NumberFormat(intlLocale(options.locale, options.numerals), {
    style: "unit",
    unit: Enum.meta(DisplayUnit, unit).intl,
    minimumFractionDigits: options.places,
    maximumFractionDigits: options.places,
  }).format(Number(converted));
}
