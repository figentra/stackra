/**
 * Stackra file contract:
 * Purpose: `exportCell`, one row value as a tabular cell: text, numbers, booleans and dates as they are, nothing as an
 *          empty cell, and an object or list as its JSON.
 * Boundary: pure and internal. The writers apply the formula guard and the byte order mark; this only picks the cell type.
 * Runtime: isomorphic
 * Governing contract: ADR 0367 (tabular cells); ADR 0307 (rule 10).
 */
import type { TabularCell } from "@stackra/data-transfer/contracts";

/**
 * `value` as a cell.
 *
 * @example
 * exportCell({ amountMinor: 1250, currency: "SAR" }); // '{"amountMinor":1250,"currency":"SAR"}'
 */
export function exportCell(value: unknown): TabularCell {
  if (value === null || value === undefined) return null;
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    value instanceof Date
  )
    return value;
  if (typeof value === "bigint") return value.toString();
  return JSON.stringify(value);
}
