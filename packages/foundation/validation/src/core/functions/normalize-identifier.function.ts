/**
 * Stackra file contract:
 * Purpose: `normalizeIdentifier(value)`, the one form an identifier is checked and stored in: spaces and hyphens
 *          removed, letters upper-cased, Arabic-Indic and Eastern Arabic-Indic digits read as Latin digits.
 * Boundary: pure. Nothing else is changed: a dot, a slash or a letter in the wrong place stays for the pattern to
 *           refuse.
 * Runtime: isomorphic
 * Governing contract: ADR 0192 (decision 2: Latin digits stored); ADR 0305.
 */

/**
 * The normalised form of `value`.
 *
 * @example
 * normalizeIdentifier("784-1990-1234567-1"); // "784199012345671"
 * normalizeIdentifier("١٠٢٣"); // "1023"
 */
export function normalizeIdentifier(value: string): string {
  return value
    .replace(/[\s-]/g, "")
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0))
    .toUpperCase();
}
