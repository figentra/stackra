/**
 * Stackra file contract:
 * Purpose: `ImportIssue`, one problem a dry run found: the file row, the field and what is wrong.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371.
 */

/** One problem in an import file. */
export interface ImportIssue {
  /** The 1-based row in the file, after the header. */
  readonly row: number;
  readonly field: string;
  readonly message: string;
}
