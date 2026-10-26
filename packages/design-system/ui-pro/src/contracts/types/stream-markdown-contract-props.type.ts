/**
 * Stackra file contract:
 * Purpose: `StreamMarkdownContractProps`, props of `StreamMarkdown`.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 to 13); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-002.
 */

/** Props of `StreamMarkdown`. */
export interface StreamMarkdownContractProps {
  /** The Markdown source text so far; it may end part-way through a block while `isStreaming`. */
  readonly children: string;
}
