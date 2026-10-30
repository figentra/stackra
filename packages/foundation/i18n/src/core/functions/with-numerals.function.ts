/**
 * Stackra file contract:
 * Purpose: `withNumerals(text, numerals)`, a number Intl already formatted, written in one numbering system with its
 *          marks: for `arab` the digits become Arabic-Indic and the group and decimal marks between digits become the
 *          Arabic ones (٬ and ٫); for `latn` the reverse; `user` leaves it alone.
 * Boundary: pure. For engines that ignore the `-u-nu-` extension `intlLocale` adds (Hermes on iOS formats `ar` and
 *           `ar-u-nu-arab` alike in Latin digits); a mark changes only between two digits, so words and codes keep
 *           theirs.
 * Runtime: isomorphic
 * Governing contract: ADR 0192 (decision 2); owner rule 2026-10-28 (formatting fixes live in a shared formatter).
 */
import { NumberingSystem } from "#core/enums/numbering-system.enum";
import { withDigits } from "#core/functions/with-digits.function";

/** The marks of each numbering system: group, then decimal. */
const MARKS = { latn: [",", "."], arab: ["٬", "٫"] } as const;

/** `mark` where it stands between two digits. */
const between = (mark: string) => new RegExp(`(?<=[0-9٠-٩])\\${mark}(?=[0-9٠-٩])`, "g");

/**
 * `text` with its digits and number marks in `numerals`.
 *
 * @example
 * withNumerals("1,310.00 US$", NumberingSystem.Arab); // "١٬٣١٠٫٠٠ US$"
 */
export function withNumerals(text: string, numerals: NumberingSystem): string {
  if (numerals === NumberingSystem.User) return text;
  const [fromGroup, fromDecimal] = MARKS[numerals === NumberingSystem.Arab ? "latn" : "arab"];
  const [group, decimal] = MARKS[numerals];
  return withDigits(
    text.replace(between(fromGroup), group).replace(between(fromDecimal), decimal),
    numerals,
  );
}
