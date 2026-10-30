/**
 * Stackra file contract:
 * Purpose: `collectionGroupsOf()`, the rows gathered by the value of one column, in the order each value first appears, each with its aggregates.
 * Boundary: pure; `groupItemsBy` gathers them.
 * Runtime: isomorphic
 * Governing contract: data-collection plan (owner, 2026-10-29); ADR 0302 (decision 3); STA-1371.
 */
import type { AggregateKind } from "#contracts/enums/aggregate-kind.enum";
import type { CollectionGroup } from "#contracts/types/collection-group.type";
import type { CollectionItem } from "#contracts/types/collection-item.type";
import { collectionAggregatesOf } from "#core/functions/collection-aggregates-of.function";
import { groupItemsBy } from "#core/functions/group-items-by.function";

/**
 * The groups of the rows.
 * @param items - the rows, in order
 * @param columnId - the column grouped by
 * @param aggregates - the aggregate of each column
 */
export function collectionGroupsOf<TItem extends CollectionItem>(
  items: readonly TItem[],
  columnId: string,
  aggregates: Readonly<Record<string, AggregateKind>>,
): readonly CollectionGroup<TItem>[] {
  return groupItemsBy(items, columnId).map((group) => ({
    ...group,
    aggregates: collectionAggregatesOf(group.items, aggregates),
  }));
}
