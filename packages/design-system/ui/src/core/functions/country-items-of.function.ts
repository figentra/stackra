/**
 * Stackra file contract:
 * Purpose: `countryItemsOf(input)`, the choices of a CountrySelect: each country's flag and name in the active
 *          language, the preferred ones first, the rest in the language's alphabetical order.
 * Boundary: pure; `regionNamesOf` names them, and an unknown code (or a runtime without Intl.DisplayNames) keeps
 *           its code as its name.
 * Runtime: isomorphic
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28).
 */
import type { SelectItem } from "#contracts/types/select-item.type";
import { COUNTRY_DIAL_CODES } from "#core/constants/country-dial-codes.constant";
import { flagOf } from "#core/functions/flag-of.function";
import { regionNamesOf } from "#core/functions/region-names-of.function";

/**
 * The countries as choices.
 * @param input - the locale, the codes offered (all by default), the preferred codes and whether to add the dial code
 * @returns the choices, `id` the ISO code
 */
export function countryItemsOf(input: {
  readonly locale: string;
  readonly countries?: readonly string[] | undefined;
  readonly preferred?: readonly string[] | undefined;
  readonly withDialCode?: boolean | undefined;
}): SelectItem[] {
  const collator = new Intl.Collator(input.locale);
  const preferred = input.preferred ?? [];
  const nameOf = regionNamesOf(input.locale);
  const item = (code: string): SelectItem => ({
    id: code,
    label: `${flagOf(code)} ${nameOf(code)}`,
    ...(input.withDialCode && COUNTRY_DIAL_CODES[code]
      ? { description: `⁦+${COUNTRY_DIAL_CODES[code]}⁩` }
      : {}),
  });
  const rest = (input.countries ?? Object.keys(COUNTRY_DIAL_CODES))
    .filter((code) => !preferred.includes(code))
    // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
    .sort((a, b) => collator.compare(nameOf(a), nameOf(b)))
    .map(item);
  return [...preferred.map(item), ...rest];
}
