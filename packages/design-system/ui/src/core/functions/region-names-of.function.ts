/**
 * Stackra file contract:
 * Purpose: `regionNamesOf(locale)`, a namer of countries and regions by ISO code in `locale`, on Intl.DisplayNames.
 * Boundary: pure. Hermes (React Native's engine) has no Intl.DisplayNames, where a CountrySelect or a PhoneField threw
 *           "undefined cannot be used as a constructor"; there, and for a code Intl does not know, the code is the name.
 * Runtime: isomorphic
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); STA-1371.
 */

/**
 * The region namer of a locale.
 * @param locale - a BCP 47 tag
 * @returns a function from an ISO 3166 code to its name, or to the code where the runtime cannot name it
 */
export function regionNamesOf(locale: string): (code: string) => string {
  // shortcut: Hermes names no region, so native lists show codes; bundle CLDR region names if native needs them.
  if (typeof Intl.DisplayNames !== "function") return (code) => code;
  const names = new Intl.DisplayNames([locale], { type: "region", fallback: "code" });
  return (code) => names.of(code) ?? code;
}
