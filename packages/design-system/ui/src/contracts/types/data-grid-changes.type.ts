/**
 * Stackra file contract:
 * Purpose: `DataGridChanges`, the pending edits of a DataGrid: the new value of each edited cell, by row id and
 *          column id. A cell edited back to its saved value is not in it.
 * Boundary: types only; plain data the app saves as it likes.
 * Runtime: isomorphic
 * Governing contract: ADR 0317 amendment 2026-10-28 (wave 3d, DataGrid).
 */
import type { DataGridValue } from "#contracts/types/data-grid-value.type";

/** The pending edits of a DataGrid, by row id and then column id. */
export type DataGridChanges = Readonly<Record<string, Readonly<Record<string, DataGridValue>>>>;
