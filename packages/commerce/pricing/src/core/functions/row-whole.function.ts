/**
 * Stackra file contract:
 * Purpose: `rowWhole`, a whole-number field of a catalogue row at or above a minimum, or a `RangeError` naming the
 *          reader and the row id.
 * Boundary: internal to the package's catalogue readers; never exported.
 * Runtime: isomorphic
 * Governing contract: ADR 0391 (decision 5).
 */
import type { CatalogueRow } from "#core/types/catalogue-row.type";

/**
 * The whole number `row[field]`.
 *
 * @throws RangeError when it is absent, not a safe integer, or below `min`.
 * @example
 * rowWhole("rateCardOf", row, "units", 1); // 1000
 */
export function rowWhole(reader: string, row: CatalogueRow, field: string, min = 0): number {
  const value = row[field];
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < min)
    throw new RangeError(
      `${reader}: row ${String(row.id)} needs a whole ${field} of at least ${min}`,
    );
  return value;
}
