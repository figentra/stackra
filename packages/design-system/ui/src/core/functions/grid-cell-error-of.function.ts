/**
 * Stackra file contract:
 * Purpose: `gridCellErrorOf()`, what is wrong with a DataGrid cell's value, if anything: required and empty, a value
 *          not of the column's kind (text left by a failed parse), a number out of range, or the column's own rule.
 * Boundary: a pure function; the first problem found wins.
 * Runtime: isomorphic
 * Governing contract: ADR 0317 amendment 2026-10-28 (wave 3d, DataGrid validation); WCAG 2.2 SC 3.3.1.
 */
import type { DataGridColumn } from "#contracts/types/data-grid-column.type";
import type { DataGridRow } from "#contracts/types/data-grid-row.type";
import type { DataGridValue } from "#contracts/types/data-grid-value.type";
import type { GridCellError } from "#core/types/grid-cell-error.type";

/**
 * The cell's error, or undefined when its value is fine.
 * @param value - the cell's current value
 * @param column - its column
 * @param row - its row, with the pending changes applied, for a rule that reads other cells
 * @returns the first problem found
 */
export function gridCellErrorOf(
  value: DataGridValue | undefined,
  column: DataGridColumn,
  row: DataGridRow,
): GridCellError | undefined {
  const type = column.type ?? "text";
  if (value === null || value === undefined || value === "") {
    return column.isRequired ? { kind: "required" } : undefined;
  }
  // A typed column holding text holds what failed to parse; a select's and a date's text is checked by shape.
  const isWrongType =
    (type === "number" && typeof value !== "number") ||
    (type === "boolean" && typeof value !== "boolean") ||
    (type === "select" && !column.options?.some((option) => option.id === value)) ||
    (type === "date" && (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)));
  if (isWrongType) return { kind: "type" };
  if (typeof value === "number") {
    if (column.min !== undefined && value < column.min) return { kind: "min", limit: column.min };
    if (column.max !== undefined && value > column.max) return { kind: "max", limit: column.max };
  }
  const message = column.validate?.(value, row);
  return message ? { kind: "custom", message } : undefined;
}
