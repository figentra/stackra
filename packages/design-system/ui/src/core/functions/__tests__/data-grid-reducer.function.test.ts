/**
 * Stackra file contract:
 * Purpose: proves `dataGridReducer`'s edges: undo and redo with nothing to walk return the same history, null and a
 *          missing original count as the same empty cell, edits to other cells of a changed row keep it, the history
 *          keeps at most 100 steps, and reset clears everything.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0317 amendment 2026-10-28 (wave 3d, DataGrid); ADR 0022 (test placement); STA-1371.
 */
import { EMPTY_DATA_GRID_HISTORY } from "#core/constants/empty-data-grid-history.constant";
import { dataGridReducer } from "#core/functions/data-grid-reducer.function";
import type { DataGridHistory } from "#core/types/data-grid-history.type";

describe("dataGridReducer", () => {
  it("returns the same history for an undo or redo with nothing to walk", () => {
    expect(dataGridReducer(EMPTY_DATA_GRID_HISTORY, { type: "undo" })).toBe(
      EMPTY_DATA_GRID_HISTORY,
    );
    expect(dataGridReducer(EMPTY_DATA_GRID_HISTORY, { type: "redo" })).toBe(
      EMPTY_DATA_GRID_HISTORY,
    );
  });

  it("reads null over a missing original as no change", () => {
    const state = dataGridReducer(EMPTY_DATA_GRID_HISTORY, {
      type: "edit",
      edits: [{ rowId: "r", columnId: "note", value: null, original: undefined }],
    });
    expect(state).toBe(EMPTY_DATA_GRID_HISTORY);
  });

  it("keeps a row while another of its cells is changed", () => {
    const two = dataGridReducer(EMPTY_DATA_GRID_HISTORY, {
      type: "edit",
      edits: [
        { rowId: "r", columnId: "a", value: 1, original: 0 },
        { rowId: "r", columnId: "b", value: "x", original: "y" },
      ],
    });
    const one = dataGridReducer(two, {
      type: "edit",
      edits: [{ rowId: "r", columnId: "a", value: 0, original: 0 }],
    });
    expect(one.changes).toEqual({ r: { b: "x" } });
    expect(one.past).toEqual([{}, { r: { a: 1, b: "x" } }]);
    expect(one.future).toEqual([]);
  });

  it("keeps at most 100 steps of undo", () => {
    let state: DataGridHistory = EMPTY_DATA_GRID_HISTORY;
    for (let value = 1; value <= 105; value += 1)
      state = dataGridReducer(state, {
        type: "edit",
        edits: [{ rowId: "r", columnId: "a", value, original: 0 }],
      });
    expect(state.past).toHaveLength(100);
    expect(state.past[0]).toEqual({ r: { a: 5 } });
  });

  it("resets to the empty history", () => {
    const state = dataGridReducer(EMPTY_DATA_GRID_HISTORY, {
      type: "edit",
      edits: [{ rowId: "r", columnId: "a", value: 1, original: 0 }],
    });
    expect(dataGridReducer(state, { type: "reset" })).toBe(EMPTY_DATA_GRID_HISTORY);
  });
});
