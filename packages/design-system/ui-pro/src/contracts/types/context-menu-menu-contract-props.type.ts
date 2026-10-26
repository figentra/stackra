/**
 * Stackra file contract:
 * Purpose: `ContextMenuMenuContractProps`, props of `ContextMenu.Menu` that the Stackra vocabulary names.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 to 13); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-004.
 */

/** Props of `ContextMenu.Menu` that the Stackra vocabulary names. */
export interface ContextMenuMenuContractProps {
  /** The accessible name of the menu, required by its menu role; HeroUI Pro's `aria-label`. */
  readonly label: string;
}
