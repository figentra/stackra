/**
 * Stackra file contract:
 * Purpose: `Kanban.CardList` on HeroUI Pro's `Kanban.CardList`: maps the contract's `label` to `aria-label`.
 * Boundary: no behaviour of its own; selection, drag and drop and the empty state are HeroUI Pro's, passed through.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 4); ADR 0303 (decision 7); STA-403 FR-006.
 */
import { Kanban as HeroKanban } from "@heroui-pro/react/kanban";

import type { KanbanCardListProps } from "#react/kanban/kanban-card-list.props";

/** The list of cards in a column, named for assistive technology by `label`. */
export function KanbanCardList<T extends object>({ label, ...rest }: KanbanCardListProps<T>) {
  return <HeroKanban.CardList<T> {...rest} aria-label={label} />;
}
