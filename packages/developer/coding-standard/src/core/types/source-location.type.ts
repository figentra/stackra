/**
 * Stackra file contract:
 * Purpose: the start and end of a node or comment in a linted file.
 * Boundary: a structural type matching the oxlint JS plugin API; no runtime code.
 * Runtime: isomorphic
 * Governing contract: ADR 0129 (the house rules ship as an oxlint jsPlugin); ADR 0305 (one declaration per file).
 */
import type { SourcePosition } from "#core/types/source-position.type";

/** Where a node or comment starts and ends. */
export interface SourceLocation {
  /** The first character. */
  readonly start: SourcePosition;

  /** Just past the last character. */
  readonly end: SourcePosition;
}
