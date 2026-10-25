/**
 * Stackra file contract:
 * Purpose: a comment in a linted file, as oxlint's `sourceCode.getAllComments()` returns it.
 * Boundary: a structural type matching the oxlint JS plugin API; no runtime code.
 * Runtime: isomorphic
 * Governing contract: ADR 0129 (the house rules ship as an oxlint jsPlugin); ADR 0305 (one declaration per file).
 */
import type { SourceLocation } from "#core/types/source-location.type";

/** A line or block comment. */
export interface AstComment {
  /** `Line` for `//`, `Block` for `/* *\/`. */
  readonly type: "Line" | "Block" | "Shebang";

  /** The text between the delimiters. */
  readonly value: string;

  /** Start and end offsets, delimiters included. */
  readonly range: readonly [number, number];

  /** Start and end line and column. */
  readonly loc: SourceLocation;
}
