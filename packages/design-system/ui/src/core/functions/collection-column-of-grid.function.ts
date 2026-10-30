/**
 * Stackra file contract:
 * Purpose: `collectionColumnOfGrid()`, a DataGrid column as the `useCollection` engine sees it: its id, header, width,
 *          kind (`number`, `choice` for a select, `text` otherwise) and alignment.
 * Boundary: pure; shared by the web and native DataGrid, which both run their own engine over these.
 * Runtime: isomorphic
 * Governing contract: data-collection plan (owner, 2026-10-29); ADR 0317 amendment 2026-10-28; STA-1371.
 */
import type { CollectionColumn } from "#contracts/types/collection-column.type";
import type { DataGridColumn } from "#contracts/types/data-grid-column.type";
import { dataGridColumnWidth } from "#core/functions/data-grid-column-width.function";

/**
 * The engine's column for a grid column.
 * @param column - the grid column
 */
export function collectionColumnOfGrid(column: DataGridColumn): CollectionColumn {
  return {
    id: column.id,
    label: column.label,
    width: dataGridColumnWidth(column),
    minWidth: 64,
    type: column.type === "number" ? "number" : column.type === "select" ? "choice" : "text",
    ...(column.align ? { align: column.align } : {}),
  };
}
