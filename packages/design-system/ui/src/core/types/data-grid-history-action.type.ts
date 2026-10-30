/**
 * Stackra file contract:
 * Purpose: `DataGridHistoryAction`, what `dataGridReducer` handles: a batch of edits (one undo step), undo, redo, or a
 *          reset after Save or Discard.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0317 amendment 2026-10-28 (wave 3d, DataGrid undo and redo).
 */
import type { DataGridEdit } from "#core/types/data-grid-edit.type";

/** What can happen to the history: a batch of edits (one undo step), undo, redo, or a reset after Save or Discard. */
export type DataGridHistoryAction =
  | { readonly type: "edit"; readonly edits: readonly DataGridEdit[] }
  | { readonly type: "undo" | "redo" | "reset" };
