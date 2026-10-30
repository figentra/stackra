/**
 * Stackra file contract:
 * Purpose: `collectionSearchMatches()`, whether a row's text in the searched columns holds the quick search, folded as `normalizeSearchText` folds it (case, Arabic letter forms and marks).
 * Boundary: pure; an empty search matches every row.
 * Runtime: isomorphic
 * Governing contract: data-collection plan (owner, 2026-10-29); ADR 0302 (decision 3); STA-1371.
 */
import type { CollectionItem } from "#contracts/types/collection-item.type";
import { cellTextOf } from "#core/functions/cell-text-of.function";
import { normalizeSearchText } from "#core/functions/normalize-search-text.function";

/**
 * Whether the row holds the search text in one of the columns.
 * @param item - the row
 * @param search - the search text
 * @param columnIds - the columns searched
 */
export function collectionSearchMatches(
  item: CollectionItem,
  search: string,
  columnIds: readonly string[],
): boolean {
  const needle = normalizeSearchText(search);
  if (needle === "") return true;
  return columnIds.some((id) => normalizeSearchText(cellTextOf(item, id)).includes(needle));
}
