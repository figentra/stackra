/**
 * Stackra file contract:
 * Purpose: the kinds of value a `DataGrid` cell holds: `text`, `number`, `select` (one of the column's options),
 *          `date` (an ISO calendar day) and `boolean` (a checkbox).
 * Boundary: the values only; each runtime picks the editor for a kind.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0317 amendment 2026-10-28 (wave 3d, DataGrid).
 */

/** The kinds of cell a DataGrid column holds. */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); the kinds carry no labels.
export const DataGridCellType = Object.freeze([
  "text",
  "number",
  "select",
  "date",
  "boolean",
] as const);

/** One kind of DataGrid cell. */
export type DataGridCellType = (typeof DataGridCellType)[number];
