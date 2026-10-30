/**
 * Stackra file contract:
 * Purpose: `MarkdownViewerContractProps`, the props of every runtime's `MarkdownViewer`: a small, safe subset of
 *          Markdown (headings, paragraphs, lists, quotes, code, bold, italic, inline code, links) drawn with the design
 *          system's text.
 * Boundary: types only. No HTML is ever passed through; each block takes its direction from its own first letter.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0060 (right-to-left); STA-1371.
 */

/** Props shared by the web and native `MarkdownViewer`. */
export interface MarkdownViewerContractProps {
  /** The Markdown text to render. */
  readonly source: string;
}
