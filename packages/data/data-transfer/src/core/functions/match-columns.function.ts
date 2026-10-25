/**
 * Stackra file contract:
 * Purpose: `matchColumns`, the mapping proposed for a sheet: each field whose name or a label equals a header after
 *          `normalizeHeader`.
 * Boundary: pure and exact; a field it cannot match is left out for the user or the AI mapping step. Each header feeds
 *           one field at most; fields are matched in the order given.
 * Runtime: isomorphic
 * Governing contract: ADR 0367 (decision 5).
 */
import { normalizeHeader } from "#core/functions/normalize-header.function";
import type { ColumnField } from "#core/types/column-field.type";
import type { ColumnMapping } from "#core/types/column-mapping.type";

/**
 * The proposed mapping of `header` onto `fields`.
 *
 * @example
 * matchColumns(["رمز المنتج", "Price"], [{ name: "sku", labels: ["SKU", "رمز المنتج"] }, { name: "price", labels: [] }]);
 * // { sku: "رمز المنتج", price: "Price" }
 */
export function matchColumns(
  header: readonly string[],
  fields: readonly ColumnField[],
): ColumnMapping {
  const free = new Map<string, string>();
  for (const text of header) {
    const key = normalizeHeader(text);
    if (key !== "" && !free.has(key)) free.set(key, text);
  }
  const mapping: Record<string, string> = {};
  for (const field of fields) {
    for (const candidate of [field.name, ...field.labels]) {
      const key = normalizeHeader(candidate);
      const text = free.get(key);
      if (text === undefined) continue;
      mapping[field.name] = text;
      free.delete(key);
      break;
    }
  }
  return mapping;
}
