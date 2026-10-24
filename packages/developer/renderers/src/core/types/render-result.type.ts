/**
 * Stackra file contract:
 * Purpose: `RenderResult`, what rendering a document set for one assistant gives: the files, sorted by path, and the
 *          documents the assistant has no form for.
 * Boundary: type only; `renderAssistant` returns it.
 * Runtime: isomorphic
 * Governing contract: ADR 0282 (decision 2).
 */
import type { RenderedFile } from "#core/types/rendered-file.type";
import type { SkippedDocument } from "#core/types/skipped-document.type";

/** The output of one render. */
export type RenderResult = {
  /** Every file, sorted by path; no two share a path. */
  readonly files: readonly RenderedFile[];
  /** Documents left out, in input order. */
  readonly skipped: readonly SkippedDocument[];
};
