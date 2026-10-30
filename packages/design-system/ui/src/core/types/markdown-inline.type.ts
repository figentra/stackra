/**
 * Stackra file contract:
 * Purpose: `MarkdownInline`, one inline run of a Markdown line (`markdownInlineOf`).
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); STA-1371.
 */
/** One inline run. */
export interface MarkdownInline {
  readonly kind: "text" | "strong" | "emphasis" | "code" | "link";
  readonly text: string;
  readonly href?: string | undefined;
}
