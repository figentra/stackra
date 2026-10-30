/**
 * Stackra file contract:
 * Purpose: `DataGridEditorMove`, where the web DataGrid's active cell goes once an edit is committed.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0317 amendment 2026-10-28 (wave 3d, DataGrid).
 */

/** Where the active cell goes after a commit: Enter, Shift+Enter, Tab, Shift+Tab, or leaving the cell. */
export type DataGridEditorMove = "down" | "up" | "next" | "previous" | "stay";
