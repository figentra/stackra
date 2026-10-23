/**
 * Stackra file contract:
 * Purpose: `Kanban.CardList` on HeroUI Pro's `Kanban.CardList`: maps the contract's `label` to `aria-label`.
 * Boundary: no behaviour of its own; selection, drag and drop and the empty state are HeroUI Pro's, passed through.
 * Runtime: browser
 * Governing contract: ADR 0304 (decision 3); ADR 0303 (decision 7); STA-403 FR-006.
 */
import {
  Kanban as HeroKanban,
  type KanbanCardListProps as HeroKanbanCardListProps,
} from "@heroui-pro/react/kanban";

import type { KanbanCardListContractProps } from "#contracts/types/kanban-contract-props.type";

/** Props of the card list: the shared contract plus HeroUI Pro's own, with `aria-label` renamed `label`. */
export type KanbanCardListProps<T extends object> = KanbanCardListContractProps &
  Omit<HeroKanbanCardListProps<T>, keyof KanbanCardListContractProps | "aria-label">;

/** The list of cards in a column, named for assistive technology by `label`. */
export function KanbanCardList<T extends object>({ label, ...rest }: KanbanCardListProps<T>) {
  return <HeroKanban.CardList<T> {...rest} aria-label={label} />;
}
