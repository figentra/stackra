/**
 * Stackra file contract:
 * Purpose: the props the web `Markdown` and `StreamMarkdown` components take from the shared vocabulary: the
 *          Markdown source text.
 * Boundary: types only; web only. HeroUI Pro's `isStreaming` already follows the vocabulary. Every other prop
 *          (`components`, `animated`, `caret`, `controls`, the div props) is HeroUI Pro's own and passes through
 *          unchanged.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-002.
 */

/** Props of `Markdown`. */
export interface MarkdownContractProps {
  /** The Markdown source text to render. */
  readonly children: string;
}
