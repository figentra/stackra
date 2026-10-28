/**
 * Stackra file contract:
 * Purpose: `withDigits(text, numerals)`, the digits of a string switched to one numbering system: Latin for storage,
 *          search and identifiers (ADR 0192: Latin by default), Arabic-Indic for display when the user chose it.
 * Boundary: pure; only digits change. `latn` reads both Arabic-Indic (٠ to ٩) and Eastern Arabic-Indic (۰ to ۹) as
 *           Latin; `arab` writes Latin and Eastern digits as Arabic-Indic; `user` returns the text unchanged. Intl
 *           formatting picks digits through `intlLocale`, so this is for text that did not come from Intl.
 * Runtime: isomorphic
 * Governing contract: ADR 0192 (decision 2); row "numerals" of the package needs (2026-10-25).
 */
import { NumberingSystem } from "#core/enums/numbering-system.enum";

/**
 * `text` with its digits in `numerals`.
 *
 * @example
 * withDigits("رقم ١٢٣", NumberingSystem.Latn); // "رقم 123"
 * withDigits("Order 45", NumberingSystem.Arab); // "Order ٤٥"
 */
export function withDigits(text: string, numerals: NumberingSystem): string {
  switch (numerals) {
    case NumberingSystem.Latn: {
      return (
        text
          // oxlint-disable-next-line unicorn/prefer-code-point -- reads one character the pattern or loop already limits to the BMP, where code unit and code point agree
          .replaceAll(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x06_60))
          // oxlint-disable-next-line unicorn/prefer-code-point -- reads one character the pattern or loop already limits to the BMP, where code unit and code point agree
          .replaceAll(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06_f0))
      );
    }
    case NumberingSystem.Arab: {
      return text
        .replaceAll(/[۰-۹]/g, (digit) =>
          // oxlint-disable-next-line unicorn/prefer-code-point -- reads one character the pattern or loop already limits to the BMP, where code unit and code point agree
          String.fromCodePoint(digit.charCodeAt(0) - 0x06_f0 + 0x06_60),
        )
        .replaceAll(/\d/g, (digit) => String.fromCodePoint(0x06_60 + Number(digit)));
    }
    case NumberingSystem.User: {
      return text;
    }
  }
}
