/**
 * Stackra file contract:
 * Purpose: the text a Table cell shows when the app gives no `renderCell`: the row's property that the column's `id`
 *          names, as text, and nothing for a missing or null value so a cell never reads "undefined".
 * Boundary: pure; internal, not in the `.` barrel (the web and native Table import it by path).
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0313.
 */
import type { CollectionItem } from "#contracts/types/collection-item.type";

/**
 * Reads one cell's default text.
 * @param item - the row
 * @param columnId - the `id` of the column, which names the row's property
 * @returns the property as text; an empty string for undefined or null; a number or boolean as `String` writes it
 */
export function cellTextOf(item: CollectionItem, columnId: string): string {
  // A cast: a row type is the app's own, so the property a column names cannot be proven to exist.
  const value = (item as unknown as Readonly<Record<string, unknown>>)[columnId];
  return value === undefined || value === null ? "" : String(value);
}
