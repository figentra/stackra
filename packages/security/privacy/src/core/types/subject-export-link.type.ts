/**
 * Stackra file contract:
 * Purpose: `SubjectExportLink`, where a written DSAR export can be fetched: its path on the disk, the signed link and
 *          when the link stops working.
 * Boundary: a type only; `SubjectExportService.archive` returns it. The path is a random name, so it never names the
 *           subject.
 * Runtime: isomorphic
 * Governing contract: ADR 0189 (decision 1: a signed zip for seven days); STA-1375.
 */

/** A written export. */
export interface SubjectExportLink {
  /** The zip's path on the host disk. */
  readonly path: string;

  /** The signed link to the zip. */
  readonly url: string;

  /** When the link expires, ISO 8601. */
  readonly expiresAt: string;

  /** How many records the zip holds, across every section. */
  readonly records: number;
}
