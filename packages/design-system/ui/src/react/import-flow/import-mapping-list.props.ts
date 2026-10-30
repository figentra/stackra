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
  /** The file column names, in order. */
  readonly columns: readonly string[];
  /** The first value of each column, shown as a hint. */
  readonly sample?: Readonly<Record<string, string>> | undefined;
  /** The fields a column can map to. */
  readonly fields: readonly ImportField[];
  /** The current mapping of columns to fields. */
  readonly mapping: ImportMapping;
  /** Called with the new mapping when a column changes. */
  readonly onChange: (mapping: ImportMapping) => void;
}
