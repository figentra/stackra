/**
 * Stackra file contract:
 * Purpose: `SubjectExport`, everything the declared models hold about one subject: the content of a DSAR answer
 *          (GDPR Art. 15 and 20, PDPL Art. 4 rights of access and portability).
 * Boundary: a type only; `SubjectExportService.collect` builds it and `archive` writes it as a zip.
 * Runtime: isomorphic
 * Governing contract: ADR 0189 (decision 1); STA-1375.
 */
import type { SubjectExportSection } from "#contracts/types/subject-export-section.type";

/** One subject's data across the declared models. */
export interface SubjectExport {
  /** The subject's public id. */
  readonly subject: string;

  /** When the export was collected, ISO 8601. */
  readonly generatedAt: string;

  /** One section per declared model, in declaration order. */
  readonly sections: readonly SubjectExportSection[];
}
