/**
 * Stackra file contract:
 * Purpose: the parts of oxlint's `context.sourceCode` that the house rules read.
 * Boundary: a structural type matching the oxlint JS plugin API; no runtime code.
 * Runtime: isomorphic
 * Governing contract: ADR 0129 (the house rules ship as an oxlint jsPlugin); ADR 0305 (one declaration per file).
 */
import type { AstComment } from "#core/types/ast-comment.type";

/** The linted file's text and comments. */
export interface SourceCode {
  /** The whole source text. */
  readonly text: string;

  /** The source text split into lines, without line breaks. */
  readonly lines: readonly string[];

  /** Every comment in the file, in source order. */
  getAllComments: () => readonly AstComment[];
}
