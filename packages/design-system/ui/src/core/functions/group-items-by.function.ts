/**
 * Stackra file contract:
 * Purpose: `groupItemsBy()`, the rows of a table gathered by the text of one column, groups in the order their value
 *          first appears and rows kept in their order within a group.
 * Boundary: a pure function.
 * Runtime: isomorphic
 * Governing contract: product audit 2026-10-28 (DataTable group-by).
 */
import type { CollectionItem } from "#contracts/types/collection-item.type";
import { cellTextOf } from "#core/functions/cell-text-of.function";

/**
 * The groups of `items`.
 * @param items - the rows
 * @param columnId - the column whose text keys the groups
 * @returns each group's key with its rows
 */
export function groupItemsBy<TItem extends CollectionItem>(
  items: readonly TItem[],
  columnId: string,
): { readonly key: string; readonly items: readonly TItem[] }[] {
  const groups = new Map<string, TItem[]>();
  for (const item of items) {
    const key = cellTextOf(item, columnId);
    const group = groups.get(key);
    if (group) group.push(item);
    else groups.set(key, [item]);
  }
  return [...groups].map(([key, members]) => ({ key, items: members }));
}
