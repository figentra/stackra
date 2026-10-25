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
    case NumberingSystem.Latn:
      return text
        .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
        .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0));
    case NumberingSystem.Arab:
      return text
        .replace(/[۰-۹]/g, (digit) => String.fromCharCode(digit.charCodeAt(0) - 0x06f0 + 0x0660))
        .replace(/\d/g, (digit) => String.fromCharCode(0x0660 + Number(digit)));
    case NumberingSystem.User:
      return text;
  }
}
