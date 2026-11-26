/**
 * Stackra file contract:
 * Purpose: `RenameNote`, a place `renameExports` leaves to a person (a namespace use of a moved export), before the
 *          caller names its file and codemod.
 * Boundary: type only.
 * Runtime: node
 * Governing contract: ADR 0199 (decision 2); STA-145.
 */

/** A place to change by hand in one file. */
export type RenameNote = {
  /** The line, from 1. */
  readonly line: number;

  /** The column, from 1. */
  readonly column: number;

  /** The code there. */
  readonly code: string;

  /** What to do. */
  readonly message: string;
};
