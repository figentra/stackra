/**
 * Stackra file contract:
 * Purpose: `FloatingTableOfContentsBarContractProps`, props of `FloatingTableOfContents.Bar` that the Stackra
 *          vocabulary names.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 to 13); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-004.
 */

/** Props of `FloatingTableOfContents.Bar` that the Stackra vocabulary names. */
export interface FloatingTableOfContentsBarContractProps {
  /** True to highlight the bar as the current section; HeroUI Pro's `active`. */
  readonly isActive?: boolean | undefined;
}
