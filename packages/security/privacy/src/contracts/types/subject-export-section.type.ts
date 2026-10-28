/**
 * Stackra file contract:
 * Purpose: `SubjectExportSection`, the records of one declared model in a subject's export.
 * Boundary: a type only; one section per `PersonalData` declaration, empty sections included so the export shows
 *           what was searched.
 * Runtime: isomorphic
 * Governing contract: ADR 0189 (decision 1); STA-1375.
 */
import type { SubjectRecord } from "#contracts/types/subject-record.type";

/** One model's part of an export. */
export interface SubjectExportSection {
  /** The model key of the records (`crm.customer`). */
  readonly kind: string;

  /** The subject's rows of that model. */
  readonly records: readonly SubjectRecord[];
}
