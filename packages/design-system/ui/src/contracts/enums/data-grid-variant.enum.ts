/**
 * Stackra file contract:
 * Purpose: the layouts of a `DataGrid`: `sheet`, a spreadsheet of typed columns, and `matrix`, a quantity matrix
 *          (rows such as colours, number columns such as sizes) with a total per row and per column.
 * Boundary: the values only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0317 amendment 2026-10-28 (wave 3d, DataGrid).
 */

/** The layouts of a DataGrid. */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128).
export const DataGridVariant = Object.freeze(["sheet", "matrix"] as const);

/** One DataGrid layout. */
export type DataGridVariant = (typeof DataGridVariant)[number];
