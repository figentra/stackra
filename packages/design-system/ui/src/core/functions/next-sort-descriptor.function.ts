/**
 * Stackra file contract:
 * Purpose: the sort a press on a column header moves to: a column not yet sorted starts ascending, and a sorted one
 *          flips direction. The web table's headers do this through React Aria; the native adapted table and the
 *          DataTable of a later wave have no such header, so they ask this function.
 * Boundary: pure; internal, not in the `.` barrel.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0313.
 */
import type { SortDescriptor } from "#contracts/types/sort-descriptor.type";

/**
 * Gives the sort after a press on a column.
 * @param current - the sort now in force, or undefined for none
 * @param column - the `id` of the column pressed
 * @returns descending for the column that is sorted ascending, otherwise ascending
 */
export function nextSortDescriptor(
  current: SortDescriptor | undefined,
  column: string,
): SortDescriptor {
  const isFlip = current?.column === column && current.direction === "ascending";
  return { column, direction: isFlip ? "descending" : "ascending" };
}
