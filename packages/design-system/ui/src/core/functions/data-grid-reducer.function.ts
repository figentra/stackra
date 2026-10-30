/**
 * Stackra file contract:
 * Purpose: `dataGridReducer()`, the DataGrid's pending changes with undo and redo: a
 *          batch of edits (a typed value, a paste, a fill, a clear, a bulk edit) is one step; undo and redo walk the
 *          steps; reset empties everything after Save or Discard (to
 *          `EMPTY_DATA_GRID_HISTORY`).
 * Boundary: a pure reducer over immutable snapshots; it keeps the last 100 steps. An edit back to the saved value
 *           drops the cell from the changes, and a batch that changes nothing adds no step.
 * Runtime: isomorphic
 * Governing contract: ADR 0317 amendment 2026-10-28 (wave 3d, DataGrid undo and redo).
 */
import type { DataGridValue } from "#contracts/types/data-grid-value.type";
import { EMPTY_DATA_GRID_HISTORY } from "#core/constants/empty-data-grid-history.constant";
import type { DataGridHistory } from "#core/types/data-grid-history.type";
import type { DataGridHistoryAction } from "#core/types/data-grid-history-action.type";

/** How many steps undo can walk back. */
const LIMIT = 100;

/** Whether two values are the same cell value (null and a missing value are both empty). */
function isSame(a: DataGridValue | undefined, b: DataGridValue | undefined): boolean {
  return (a ?? null) === (b ?? null);
}

/**
 * The next history.
 * @param state - the history now
 * @param action - what happened
 * @returns the history after it
 */
export function dataGridReducer(
  state: DataGridHistory,
  action: DataGridHistoryAction,
): DataGridHistory {
  switch (action.type) {
    case "edit": {
      const next: Record<string, Record<string, DataGridValue>> = {};
      for (const [rowId, row] of Object.entries(state.changes)) next[rowId] = { ...row };
      for (const edit of action.edits) {
        const row = (next[edit.rowId] ??= {});
        // oxlint-disable-next-line typescript/no-dynamic-delete -- the changes are a keyed record of this copy; an edit back to the saved value drops its cell
        if (isSame(edit.value, edit.original)) delete row[edit.columnId];
        else row[edit.columnId] = edit.value;
        // oxlint-disable-next-line typescript/no-dynamic-delete -- the changes are a keyed record of this copy; a row with no changed cell is dropped
        if (Object.keys(row).length === 0) delete next[edit.rowId];
      }
      if (JSON.stringify(next) === JSON.stringify(state.changes)) return state;
      return { changes: next, past: [...state.past, state.changes].slice(-LIMIT), future: [] };
    }
    case "undo": {
      const previous = state.past.at(-1);
      if (!previous) return state;
      return {
        changes: previous,
        past: state.past.slice(0, -1),
        future: [...state.future, state.changes],
      };
    }
    case "redo": {
      const following = state.future.at(-1);
      if (!following) return state;
      return {
        changes: following,
        past: [...state.past, state.changes],
        future: state.future.slice(0, -1),
      };
    }
    case "reset": {
      return EMPTY_DATA_GRID_HISTORY;
    }
  }
}
