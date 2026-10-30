/**
 * Stackra file contract:
 * Purpose: `ImportDryRun`, the result of checking an import without saving: how many rows would be created, updated,
 *          skipped or refused, and why.
 * Boundary: types only. The server runs it; the flow only shows it.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371.
 */
import type { ImportIssue } from "#contracts/types/import-issue.type";

/** The result of an import's dry run. */
export interface ImportDryRun {
  readonly created: number;
  readonly updated: number;
  /** Rows left alone (unchanged, or duplicates); left out, none are shown. */
  readonly skipped?: number | undefined;
  readonly failed: number;
  readonly issues: readonly ImportIssue[];
}
