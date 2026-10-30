/**
 * Stackra file contract:
 * Purpose: `numberFormatIn(tag, options, numerals)`, the one number formatter every number, money and chart value of
 *          Stackra goes through: Intl.NumberFormat in `tag`, its output written in `numerals` (by default the tag's
 *          own `-u-nu-` keyword), so the configured digits show on every engine, Hermes on iOS included, which ignores
 *          the keyword. It has `Intl.NumberFormat`'s `format`, so a library that takes a formatter (intl-messageformat,
 *          a chart's axis) takes it as is.
 * Boundary: pure apart from Intl. Intl is asked for the digits by option too (an engine that reads it writes the
 *           locale's own marks for them). For `arab` the digits then become Arabic-Indic and the group, decimal and
 *           percent marks the Arabic ones, by the formatter's own parts where the engine has `formatToParts` (a locale whose group mark
 *           is a dot keeps its meaning), else by `withNumerals`; for `latn` only digits change, the marks are the
 *           locale's; `user` leaves Intl's output alone.
 * Runtime: isomorphic
 * Governing contract: ADR 0192 (decision 2, as amended 2026-10-28: the digits are a per-customer setting, Latin by
 *                     default); owner rule 2026-10-28 (formatting fixes live in a shared formatter).
 */
import { NumberingSystem } from "#core/enums/numbering-system.enum";
import { numeralsOf } from "#core/functions/numerals-of.function";
import { withDigits } from "#core/functions/with-digits.function";
import { withNumerals } from "#core/functions/with-numerals.function";
import type { NumberFormatIn } from "#core/types/number-format-in.type";

/** The Arabic group, decimal and percent marks, by the part type Intl gives them. */
const ARABIC_MARKS: Readonly<Partial<Record<string, string>>> = {
  group: "٬",
  decimal: "٫",
  percentSign: "٪",
};

/**
 * Intl's formatter asked for `numerals` by option too, which wins over a tag's contrary keyword where the engine reads
 * it; an engine that refuses the option gets the tag alone.
 */
function intlFormat(tag: string, options: Intl.NumberFormatOptions | undefined, numerals: string) {
  try {
    return new Intl.NumberFormat(tag, { ...options, numberingSystem: numerals });
  } catch {
    return new Intl.NumberFormat(tag, options);
  }
}

/**
 * A number formatter of `tag` writing `numerals`.
 *
 * @example
 * numberFormatIn("en", undefined, NumberingSystem.Arab).format(1310.5); // "١٬٣١٠٫٥" on every engine
 */
export function numberFormatIn(
  tag: string,
  options?: Intl.NumberFormatOptions,
  numerals: NumberingSystem = numeralsOf(tag),
): NumberFormatIn {
  if (numerals === NumberingSystem.User) {
    const own = new Intl.NumberFormat(tag, options);
    return { format: (value) => own.format(value) };
  }
  const format = intlFormat(tag, options, numerals);
  if (typeof format.formatToParts !== "function")
    return { format: (value) => withNumerals(format.format(value), numerals) };
  return {
    format: (value) =>
      format
        .formatToParts(value)
        .map(
          ({ type, value: text }) =>
            (numerals === NumberingSystem.Arab ? ARABIC_MARKS[type] : undefined) ??
            withDigits(text, numerals),
        )
        .join(""),
  };
}
