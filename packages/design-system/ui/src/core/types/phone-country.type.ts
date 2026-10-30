/**
 * Stackra file contract:
 * Purpose: `PhoneCountry`, one row of the PhoneField's country list.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3).
 */

/** One country of the PhoneField's list. */
export interface PhoneCountry {
  /** The ISO 3166 alpha-2 code, for example "SA". */
  readonly code: string;
  /** The country's name in the current locale. */
  readonly name: string;
  /** The dial code without the plus, for example "966". */
  readonly dial: string;
  /** The flag emoji. */
  readonly flag: string;
  /** What a search matches: the name in English, Arabic and the locale, the ISO code and the dial code, lower-cased. */
  readonly search: string;
}
