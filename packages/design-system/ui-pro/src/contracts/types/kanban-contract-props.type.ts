/**
 * Stackra file contract:
 * Purpose: the props the web `Kanban` compound takes from the shared vocabulary: the board's size, and the
 *          accessible name of a column's card list.
 * Boundary: types only; web only. Every other prop is HeroUI Pro's own and passes through unchanged.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 4); ADR 0303 (decision 7); STA-403 FR-006.
 */
import type { Size } from "@stackra/ui/contracts";

/** Props of the `Kanban` root that the Stackra vocabulary names. */
export interface KanbanContractProps {
  /** The card padding, text size and column width. Defaults to `md`. */
  readonly size?: Size | undefined;
}
