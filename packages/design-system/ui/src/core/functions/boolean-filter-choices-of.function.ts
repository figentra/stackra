/**
 * Stackra file contract:
 * Purpose: `booleanFilterChoicesOf(definition, locale, t)`, the two radios of a yes-or-no filter: "true" and "false",
 *          each labelled with the words its chip shows for that answer.
 * Boundary: pure; the web and native FilterEditor both use it.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0318 (decisions 3 and 4).
 */
import type { ChoiceOption } from "#contracts/types/choice-option.type";
import type { FilterDefinition } from "#contracts/types/filter-definition.type";
import { filterChipTextOf } from "#core/functions/filter-chip-text-of.function";
import { filterChipWordsOf } from "#core/functions/filter-chip-words-of.function";
import type { CatalogueText } from "#core/types/catalogue-text.type";

/**
 * The yes and no radios of a boolean filter.
 * @param definition - the boolean filter
 * @param locale - the locale the words are written in
 * @param t - the ui translator
 * @returns the "true" option, then the "false" one
 */
export function booleanFilterChoicesOf(
  definition: FilterDefinition,
  locale: string,
  t: CatalogueText,
): readonly ChoiceOption[] {
  const words = filterChipWordsOf(t);
  return [
    { value: "true", label: filterChipTextOf(definition, true, locale, words) },
    { value: "false", label: filterChipTextOf(definition, false, locale, words) },
  ];
}
