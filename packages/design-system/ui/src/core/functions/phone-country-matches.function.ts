/**
 * Stackra file contract:
 * Purpose: `phoneCountryMatches`, the PhoneField's country search: a query matches the name in English, Arabic or the
 *          current locale, the ISO code, or the dial code (with or without the plus, in Latin or Arabic-Indic digits).
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0060.
 */
import type { PhoneCountry } from "#core/types/phone-country.type";

/** True when the query matches the country's search text. */
export function phoneCountryMatches(country: PhoneCountry, query: string): boolean {
  const wanted = query
    // Arabic-Indic and Persian digits typed for a dial code read as Latin.
    .replaceAll(/[٠-٩]/g, (digit) => String((digit.codePointAt(0) ?? 0) - 0x06_60))
    .replaceAll(/[۰-۹]/g, (digit) => String((digit.codePointAt(0) ?? 0) - 0x06_f0))
    .replace(/^\s*\+/, "")
    .trim()
    .toLocaleLowerCase();
  return wanted === "" || country.search.includes(wanted);
}
