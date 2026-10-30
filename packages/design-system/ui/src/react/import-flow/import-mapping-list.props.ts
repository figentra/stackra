/**
 * Stackra file contract:
 * Purpose: `ImportMappingListProps`, the props of the web `ImportMappingList`.
 * Boundary: types only; internal to `ImportFlow` and `ImportDialog`.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); STA-1371.
 */
import type { ImportField } from "#contracts/types/import-field.type";
import type { ImportMapping } from "#contracts/types/import-mapping.type";

/** Props of the web ImportMappingList. */
export interface ImportMappingListProps {
  readonly columns: readonly string[];
  readonly sample?: Readonly<Record<string, string>> | undefined;
  readonly fields: readonly ImportField[];
  readonly mapping: ImportMapping;
  readonly onChange: (mapping: ImportMapping) => void;
}
