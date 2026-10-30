/**
 * Stackra file contract:
 * Purpose: `MarkdownInline`, one inline run of a Markdown line (`markdownInlineOf`).
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); STA-1371.
 */
/** One inline run. */
export interface MarkdownInline {
  /** The style of the run: plain, bold, italic, code or link. */
  readonly kind: "text" | "strong" | "emphasis" | "code" | "link";
  /** The words of the run. */
  readonly text: string;
  /** The link target, for a `link` run. */
  readonly href?: string | undefined;
}
