/**
 * Stackra file contract:
 * Purpose: `CodeBlockCopyButtonContractProps`, props of `CodeBlock.CopyButton` that the Stackra vocabulary names.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 to 13); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-002.
 */

/** Props of `CodeBlock.CopyButton` that the Stackra vocabulary names. */
export interface CodeBlockCopyButtonContractProps {
  /** The accessible name of the icon-only copy button; HeroUI Pro's `aria-label`, `ui_pro::code_block.copy` when left out. */
  readonly label?: string | undefined;
}
