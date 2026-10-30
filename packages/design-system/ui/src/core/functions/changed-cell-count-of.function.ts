/**
 * Stackra file contract:
 * Purpose: `changedCellCountOf()`, how many cells a DataGrid's pending changes touch.
 * Boundary: a pure function.
 * Runtime: isomorphic
 * Governing contract: ADR 0317 amendment 2026-10-28 (wave 3d, DataGrid save bar).
 */
import type { DataGridChanges } from "#contracts/types/data-grid-changes.type";

/**
 * The count of edited cells in `changes`.
 * @param changes - the pending changes
 * @returns how many cells they touch
 */
export function changedCellCountOf(changes: DataGridChanges): number {
  return Object.values(changes).reduce((count, row) => count + Object.keys(row).length, 0);
}
