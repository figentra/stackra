/**
 * Stackra file contract:
 * Purpose: `ImportReviewProps`, the props of the native `ImportReview`.
 * Boundary: types only; internal to the native `ImportFlow` and `ImportDialog`.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); STA-1371.
 */
import type { ReactNode } from "react";

import type { ImportDryRun } from "#contracts/types/import-dry-run.type";

/** Props of the native ImportReview. */
export interface ImportReviewProps {
  /** The counts and problems to show. */
  readonly result: ImportDryRun;
  /** Drawn under the problems' heading, such as a button that shares them. */
  readonly issuesAction?: ReactNode;
  /** True for the summary of a finished import: the labels say what was done, not what would be. */
  readonly isDone?: boolean | undefined;
}
