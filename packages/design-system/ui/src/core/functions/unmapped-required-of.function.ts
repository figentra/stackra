/**
 * Stackra file contract:
 * Purpose: `unmappedRequiredOf`, the required import fields no column fills yet, which block the dry run.
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-1371.
 */
import type { ImportField } from "#contracts/types/import-field.type";
import type { ImportMapping } from "#contracts/types/import-mapping.type";

/** The required fields `mapping` leaves empty. */
export function unmappedRequiredOf(
  fields: readonly ImportField[],
  mapping: ImportMapping,
): ImportField[] {
  const filled = new Set(Object.values(mapping));
  return fields.filter((field) => field.isRequired === true && !filled.has(field.key));
}
