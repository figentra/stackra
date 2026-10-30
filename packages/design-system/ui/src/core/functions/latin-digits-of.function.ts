/**
 * Stackra file contract:
 * Purpose: `latinDigitsOf()`, text with Arabic-Indic and Eastern Arabic-Indic digits (and the Arabic decimal and
 *          thousands marks) turned into Latin ones, so a number typed or pasted in Arabic parses.
 * Boundary: a pure function; every other character is kept.
 * Runtime: isomorphic
 * Governing contract: ADR 0192 (digits); ADR 0317 amendment 2026-10-28 (wave 3d, DataGrid).
 */

/**
 * `text` with Latin digits.
 * @param text - the text to read
 * @returns the same text, its digits Latin
 */
export function latinDigitsOf(text: string): string {
  return text
    .replaceAll(/[٠-٩]/g, (digit) => String((digit.codePointAt(0) ?? 0x06_60) - 0x06_60))
    .replaceAll(/[۰-۹]/g, (digit) => String((digit.codePointAt(0) ?? 0x06_f0) - 0x06_f0))
    .replaceAll("٫", ".")
    .replaceAll("٬", ",");
}
