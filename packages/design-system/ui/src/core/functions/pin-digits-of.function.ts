/**
 * Stackra file contract:
 * Purpose: `pinDigitsOf(text, length)`, the PIN a typed text stands for: Arabic-Indic (٠-٩) and Persian (۰-۹) digits
 *          read as Latin ones, every other character dropped, cut to `length` digits.
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: gap inventory row 3 (owner decision 2026-10-28, "P1 + P2 core"); ADR 0060 (RTL and Arabic).
 */

/** The PIN in `text`: Latin digits only, at most `length` of them. */
export function pinDigitsOf(text: string, length: number): string {
  return text
    .replaceAll(/[٠-٩۰-۹]/g, (digit) => String((digit.codePointAt(0) ?? 0) % 16))
    .replaceAll(/\D/g, "")
    .slice(0, length);
}
