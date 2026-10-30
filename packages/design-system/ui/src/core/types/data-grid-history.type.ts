/**
 * Stackra file contract:
 * Purpose: `DataGridHistory`, the state of `dataGridReducer`: the pending changes with the undo and redo stacks of
 *          earlier changes.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0317 amendment 2026-10-28 (wave 3d, DataGrid undo and redo).
 */
import type { DataGridChanges } from "#contracts/types/data-grid-changes.type";

/** The pending changes and their history. */
export interface DataGridHistory {
  /** The pending changes now. */
  readonly changes: DataGridChanges;
  /** Earlier pending changes, the latest last. */
  readonly past: readonly DataGridChanges[];
  /** Undone pending changes, the next redo last. */
  readonly future: readonly DataGridChanges[];
}
