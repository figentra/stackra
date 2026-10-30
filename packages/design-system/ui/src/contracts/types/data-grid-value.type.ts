/**
 * Stackra file contract:
 * Purpose: `DataGridValue`, what one DataGrid cell holds: text, a number, a boolean, an ISO day or option id (as
 *          text), or null for an empty cell. Text that failed to parse for a typed column is kept as text, so the
 *          grid can show it as invalid instead of dropping what the user pasted.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0317 amendment 2026-10-28 (wave 3d, DataGrid).
 */

/** The value of one DataGrid cell. */
export type DataGridValue = string | number | boolean | null;
