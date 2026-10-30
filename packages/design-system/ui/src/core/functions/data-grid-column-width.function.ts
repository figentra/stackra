/**
 * Stackra file contract:
 * Purpose: `dataGridColumnWidth()`, the width a DataGrid column is drawn at: its own `width`, else 96 for numbers and
 *          booleans and 160 for the rest (CSS pixels on web, points on native).
 * Boundary: pure; shared by the web and native DataGrid so both runtimes size a column alike.
 * Runtime: isomorphic
 * Governing contract: ADR 0317 amendment 2026-10-28 (wave 3d, DataGrid); STA-1371.
 */
import type { DataGridColumn } from "#contracts/types/data-grid-column.type";

/**
 * The column's width.
 * @param column - the grid column
 */
export function dataGridColumnWidth(column: DataGridColumn): number {
  return column.width ?? (column.type === "number" || column.type === "boolean" ? 96 : 160);
}
