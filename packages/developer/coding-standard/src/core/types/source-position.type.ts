/**
 * Stackra file contract:
 * Purpose: a line and column in a linted file, as oxlint reports them (line 1-based, column 0-based).
 * Boundary: a structural type matching the oxlint JS plugin API; no runtime code.
 * Runtime: isomorphic
 * Governing contract: ADR 0129 (the house rules ship as an oxlint jsPlugin); ADR 0305 (one declaration per file).
 */

/** A point in the source text. */
export interface SourcePosition {
  /** The 1-based line. */
  readonly line: number;

  /** The 0-based column. */
  readonly column: number;
}
