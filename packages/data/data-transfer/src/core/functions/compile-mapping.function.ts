/**
 * Stackra file contract:
 * Purpose: `compileMapping`, a function that turns a row's cells into the record a target's schema reads, from the
 *          sheet's header and a field-to-header mapping.
 * Boundary: pure. Headers match after `normalizeHeader`; with duplicate headers the first column wins. An empty cell
 *           and a mapped column the file lacks both leave the field out, so the schema decides whether it is required.
 * Runtime: isomorphic
 * Governing contract: ADR 0367 (decision 5).
 */
import type { ColumnMapping } from "#core/types/column-mapping.type";
import { normalizeHeader } from "#core/functions/normalize-header.function";

/**
 * The mapper of one sheet.
 *
 * @example
 * const toRecord = compileMapping(header, { sku: "رمز المنتج", price: "السعر" });
 * schema.safeParse(toRecord(row.cells));
 */
export function compileMapping(
  header: readonly string[],
  mapping: ColumnMapping,
): (cells: readonly string[]) => Record<string, string> {
  const columns = new Map<string, number>();
  header.forEach((text, index) => {
    const key = normalizeHeader(text);
    if (!columns.has(key)) columns.set(key, index);
  });
  const fields: [string, number][] = [];
  for (const [field, text] of Object.entries(mapping)) {
    const index = columns.get(normalizeHeader(text));
    if (index !== undefined) fields.push([field, index]);
  }
  return (cells) => {
    const record: Record<string, string> = {};
    for (const [field, index] of fields) {
      const value = cells[index] ?? "";
      if (value !== "") record[field] = value;
    }
    return record;
  };
}
