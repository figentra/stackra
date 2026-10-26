/**
 * Stackra file contract:
 * Purpose: `FloatingTableOfContentsItemContractProps`, props of `FloatingTableOfContents.Item` that the Stackra
 *          vocabulary names.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 to 13); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-004.
 */

/** Props of `FloatingTableOfContents.Item` that the Stackra vocabulary names. */
export interface FloatingTableOfContentsItemContractProps {
  /** True to highlight the item as the current section; HeroUI Pro's `active`. */
  readonly isActive?: boolean | undefined;
}
