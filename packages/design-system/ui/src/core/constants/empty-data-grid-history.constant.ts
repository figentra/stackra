/**
 * Stackra file contract:
 * Purpose: `EMPTY_DATA_GRID_HISTORY`, a DataGrid history with no changes and nothing to undo or redo.
 * Boundary: a frozen value.
 * Runtime: isomorphic
 * Governing contract: ADR 0317 amendment 2026-10-28 (wave 3d, DataGrid undo and redo).
 */
import type { DataGridHistory } from "#core/types/data-grid-history.type";

/** A history with no changes. */
export const EMPTY_DATA_GRID_HISTORY: DataGridHistory = Object.freeze({
  changes: {},
  past: [],
  future: [],
});
