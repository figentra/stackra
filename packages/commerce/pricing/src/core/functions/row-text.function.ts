/**
 * Stackra file contract:
 * Purpose: `rowText`, a non-empty text field of a catalogue row, or a `RangeError` naming the reader and the row id.
 * Boundary: internal to the package's catalogue readers; never exported.
 * Runtime: isomorphic
 * Governing contract: ADR 0391 (decision 5).
 */
import type { CatalogueRow } from "@stackra/contracts";

/**
 * The text `row[field]`.
 *
 * @throws RangeError when it is absent, empty or not text.
 * @example
 * rowText("offerOf", row, "kind"); // "percent"
 */
export function rowText(reader: string, row: CatalogueRow, field: string): string {
  const value = row[field];
  if (typeof value !== "string" || value.length === 0)
    throw new RangeError(`${reader}: row ${String(row.id)} needs text ${field}`);
  return value;
}
