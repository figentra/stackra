/**
 * Stackra file contract:
 * Purpose: `RowError`, the per-row error report entry: where the row is and every issue its schema found.
 * Boundary: a type only. It names the row by sheet and number and never copies the row's cells, so the report holds
 *           no imported personal data beyond what the schema message quotes.
 * Runtime: isomorphic
 * Governing contract: ADR 0367 (decision 6).
 */
import type { RowIssue } from "#contracts/types/row-issue.type";

/** A row that was not imported. */
export interface RowError {
  /** The sheet name. */
  readonly sheet: string;

  /** The row number in the sheet. */
  readonly row: number;

  /** Why it was refused. */
  readonly issues: readonly RowIssue[];
}
