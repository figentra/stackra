/**
 * Stackra file contract:
 * Purpose: `sortCollectionItems()`, the rows ordered by several sort keys, numbers by value and text by the locale's collation (numeric, so "#9" comes before "#10").
 * Boundary: pure and stable: rows equal on every key keep their order. Empty values sort last in either direction.
 * Runtime: isomorphic
 * Governing contract: data-collection plan (owner, 2026-10-29); ADR 0302 (decision 3); STA-1371.
 */
import type { CollectionItem } from "#contracts/types/collection-item.type";
import type { SortDescriptor } from "#contracts/types/sort-descriptor.type";

/** Whether a value sorts as empty (last, whatever the direction). */
const isEmpty = (value: unknown) => value === null || value === undefined || value === "";

/**
 * The rows in sort order.
 * @param items - the rows
 * @param sort - the keys, most significant first
 * @param locale - the locale text is collated in
 */
export function sortCollectionItems<TItem extends CollectionItem>(
  items: readonly TItem[],
  sort: readonly SortDescriptor[],
  locale: string,
): readonly TItem[] {
  if (sort.length === 0) return items;
  const collator = new Intl.Collator(locale, { numeric: true, sensitivity: "base" });
  const valueOf = (item: TItem, id: string) =>
    (item as unknown as Readonly<Record<string, unknown>>)[id];
  const compare = (left: unknown, right: unknown): number => {
    if (typeof left === "number" && typeof right === "number") return left - right;
    if (left instanceof Date && right instanceof Date) return left.getTime() - right.getTime();
    return collator.compare(String(left), String(right));
  };
  return (
    items
      .map((item, index) => ({ item, index }))
      // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
      .sort((a, b) => {
        for (const key of sort) {
          const left = valueOf(a.item, key.column);
          const right = valueOf(b.item, key.column);
          // Empty values stay last whichever way the column runs.
          if (isEmpty(left) || isEmpty(right)) {
            if (isEmpty(left) !== isEmpty(right)) return isEmpty(left) ? 1 : -1;
            continue;
          }
          const order = compare(left, right);
          if (order !== 0) return key.direction === "descending" ? -order : order;
        }
        return a.index - b.index;
      })
      .map(({ item }) => item)
  );
}
