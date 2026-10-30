/**
 * Stackra file contract:
 * Purpose: `moveItem(items, from, to)`, a copy of `items` with the item at `from` moved to `to`, the step every
 *          `SortableList` move ends in (a drop, a keyboard move, a screen-reader action).
 * Boundary: pure; an index outside the list, or `from === to`, returns the list unchanged (the same array).
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); design-system gap inventory (2026-10-28) row 10.
 */

/**
 * Moves one item to a new index.
 *
 * @example
 * moveItem(["a", "b", "c"], 0, 2); // ["b", "c", "a"]
 */
export function moveItem<T>(items: readonly T[], from: number, to: number): readonly T[] {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) return items;
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved as T);
  return next;
}
