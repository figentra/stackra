/**
 * Stackra file contract:
 * Purpose: `ExportFormat`, the file formats a resource's queued export offers.
 * Boundary: an enum (`Enum.of`) written in `a.export({ formats })`.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 10: export is queued, CSV and XLSX); ADR 0294 (decision 16: Enum).
 */
import { Enum } from "@stackra/contracts";

/**
 * An export file format.
 *
 * @example
 * a.export({ formats: [ExportFormat.Csv, ExportFormat.Xlsx] })
 */
export const ExportFormat = Enum.of({
  /** Comma-separated values, UTF-8. */
  Csv: "csv",
  /** An Office Open XML workbook. */
  Xlsx: "xlsx",
});

/** One of the codes above. */
export type ExportFormat = Enum.Value<typeof ExportFormat>;
