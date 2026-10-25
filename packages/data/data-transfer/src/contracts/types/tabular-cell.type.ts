/**
 * Stackra file contract:
 * Purpose: `TabularCell`, one value a `TabularWriter` writes.
 * Boundary: a type only. A `Date` is written as a date cell in a workbook and as ISO 8601 text in a CSV file; `null`
 *           is an empty cell.
 * Runtime: isomorphic
 * Governing contract: ADR 0367 (decision 2).
 */

/** A cell value. */
export type TabularCell = string | number | boolean | Date | null;
