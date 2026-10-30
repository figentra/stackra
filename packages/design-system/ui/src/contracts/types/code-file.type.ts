/**
 * Stackra file contract:
 * Purpose: `CodeFile`, one file of a tabbed `CodeBlock`.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); STA-1371.
 */

/** One file of a tabbed code block. */
export interface CodeFile {
  /** The tab's label, usually a file name. */
  readonly title: string;
  /** The source text shown in the tab. */
  readonly code: string;
  /** The language used to colour the code. */
  readonly language?: string | undefined;
}
