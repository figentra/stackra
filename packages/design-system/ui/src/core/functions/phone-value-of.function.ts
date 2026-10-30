/**
 * Stackra file contract:
 * Purpose: `phoneValueOf(country, text)`, a typed phone number as a `PhoneValue`: Latin digits only (Arabic-Indic and
 *          Persian digits converted), the trunk 0 dropped, and the international form with the country's dial code.
 * Boundary: pure; no numbering-plan check (that needs libphonenumber). `null` when no digit is left.
 * Runtime: isomorphic
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28).
 */
import type { PhoneValue } from "#contracts/types/phone-value.type";
import { COUNTRY_DIAL_CODES } from "#core/constants/country-dial-codes.constant";
import { pinDigitsOf } from "#core/functions/pin-digits-of.function";

/** The longest national number E.164 allows. */
const MAX_DIGITS = 15;

/**
 * A phone number from what was typed.
 * @param country - the ISO country code
 * @param text - the national number as typed
 * @returns the phone value, or `null` for no digits
 */
export function phoneValueOf(country: string, text: string): PhoneValue | null {
  const dial = COUNTRY_DIAL_CODES[country] ?? "";
  let national = pinDigitsOf(text, MAX_DIGITS);
  if (dial && national.startsWith(`00${dial}`)) national = national.slice(dial.length + 2);
  national = national.replace(/^0+/, "");
  if (!national) return null;
  return { country, national, e164: `+${dial}${national}` };
}
