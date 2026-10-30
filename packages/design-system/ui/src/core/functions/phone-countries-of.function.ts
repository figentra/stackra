/**
 * Stackra file contract:
 * Purpose: `phoneCountriesOf`, the PhoneField's country list in the locale's order, each with the text a search
 *          matches (the name in English, Arabic and the locale, the ISO code and the dial code).
 * Boundary: pure; Intl names only.
 * Runtime: isomorphic
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0060.
 */
import { COUNTRY_DIAL_CODES } from "#core/constants/country-dial-codes.constant";
import { flagOf } from "#core/functions/flag-of.function";
import { regionNamesOf } from "#core/functions/region-names-of.function";
import type { PhoneCountry } from "#core/types/phone-country.type";

/** The countries offered, with a dial code, sorted by name in the locale. */
export function phoneCountriesOf(
  locale: string,
  countries?: readonly string[],
): readonly PhoneCountry[] {
  const local = regionNamesOf(locale);
  const english = regionNamesOf("en");
  const arabic = regionNamesOf("ar");
  const collator = new Intl.Collator(locale);
  return (
    (countries ?? Object.keys(COUNTRY_DIAL_CODES))
      .filter((code) => COUNTRY_DIAL_CODES[code])
      .map((code) => {
        const name = local(code);
        const dial = COUNTRY_DIAL_CODES[code] ?? "";
        const search = [name, english(code), arabic(code), code, dial]
          .join(" ")
          .toLocaleLowerCase();
        return { code, name, dial, flag: flagOf(code), search };
      })
      // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
      .sort((a, b) => collator.compare(a.name, b.name))
  );
}
