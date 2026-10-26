/**
 * Stackra file contract:
 * Purpose: `KanbanCardListContractProps`, props of `Kanban.CardList` that the Stackra vocabulary names.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 to 13); ADR 0310 (decision 4); ADR 0303 (decision 7); STA-403 FR-006.
 */

/** Props of `Kanban.CardList` that the Stackra vocabulary names. */
export interface KanbanCardListContractProps {
  /** The accessible name of the card list, usually the column title; HeroUI Pro's `aria-label`. */
  readonly label: string;
}
