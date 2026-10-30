/**
 * Stackra file contract:
 * Purpose: `nextCollectionSort()`, the sort keys after a press on a column: ascending, then descending, then off. Additive (shift or "Add to sort") it changes the column's key in place or appends it; otherwise the column becomes the only key.
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: data-collection plan (owner, 2026-10-29); ADR 0302 (decision 3); STA-1371.
 */
import type { SortDescriptor } from "#contracts/types/sort-descriptor.type";

/**
 * The next sort keys.
 * @param sort - the keys now
 * @param columnId - the column pressed
 * @param isAdditive - true to keep the other keys
 */
export function nextCollectionSort(
  sort: readonly SortDescriptor[],
  columnId: string,
  isAdditive = false,
): readonly SortDescriptor[] {
  const current = sort.find((key) => key.column === columnId);
  const next: SortDescriptor | null =
    current === undefined
      ? { column: columnId, direction: "ascending" }
      : current.direction === "ascending"
        ? { column: columnId, direction: "descending" }
        : null;
  if (!isAdditive) return next ? [next] : [];
  if (current === undefined) return next ? [...sort, next] : sort;
  return next
    ? sort.map((key) => (key.column === columnId ? next : key))
    : sort.filter((key) => key.column !== columnId);
}
