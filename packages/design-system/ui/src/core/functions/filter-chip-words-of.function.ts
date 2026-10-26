/**
 * Stackra file contract:
 * Purpose: `filterChipWordsOf(t)`, the yes, no, from and until words a filter chip uses, translated with `t` from
 *          `ui::filter_bar.*`, for `filterChipTextOf`.
 * Boundary: internal; the web and native filter bars and editors call it with `useUiText()`'s translator.
 * Runtime: isomorphic
 * Governing contract: ADR 0318 (decision 3); ADR 0080.
 */
import { UI_KEYS } from "#core/constants/ui-keys.constant";
import type { CatalogueText } from "#core/types/catalogue-text.type";
import type { FilterChipWords } from "#core/types/filter-chip-words.type";

/**
 * The filter chip words in the active locale.
 *
 * @example
 * filterChipTextOf(definition, value, locale, filterChipWordsOf(useUiText()));
 */
export function filterChipWordsOf(t: CatalogueText): FilterChipWords {
  const words = UI_KEYS.ui.filter_bar;
  return { yes: t(words.yes), no: t(words.no), from: t(words.from), until: t(words.until) };
}
