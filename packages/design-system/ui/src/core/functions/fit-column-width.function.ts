/**
 * Stackra file contract:
 * Purpose: `fitColumnWidth()`, the width that fits a column's header and its longest cell text, for the column editor's
 *          "Fit to content", estimated from the text length (no layout pass), within the column's bounds.
 * Boundary: pure. An estimate: 8 pixels a character for the body text plus the cell's padding and the header's menu.
 * Runtime: isomorphic
 * Governing contract: data-collection plan (owner, 2026-10-29); STA-1371.
 */
import type { CollectionItem } from "#contracts/types/collection-item.type";
import type { TableColumn } from "#contracts/types/table-column.type";
import { cellTextOf } from "#core/functions/cell-text-of.function";

/**
 * The width that fits the column.
 * @param column - the column
 * @param items - the rows on screen
 */
export function fitColumnWidth(column: TableColumn, items: readonly CollectionItem[]): number {
  const longest = Math.max(
    column.label.length + 4,
    ...items.map((item) => cellTextOf(item, column.id).length),
  );
  const width = Math.round(longest * 8 + 40);
  return Math.min(Math.max(width, column.minWidth ?? 64), column.maxWidth ?? 640);
}
