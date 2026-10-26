/**
 * Stackra file contract:
 * Purpose: `KanbanCardListProps`, props of the card list: the shared contract plus HeroUI Pro's own, with `aria-label`
 *          renamed `label`.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 4); ADR 0303 (decision 7); STA-403 FR-006.
 */
import type { KanbanCardListProps as HeroKanbanCardListProps } from "@heroui-pro/react/kanban";

import type { KanbanCardListContractProps } from "#contracts/types/kanban-card-list-contract-props.type";

/** Props of the card list: the shared contract plus HeroUI Pro's own, with `aria-label` renamed `label`. */
export type KanbanCardListProps<T extends object> = KanbanCardListContractProps &
  Omit<HeroKanbanCardListProps<T>, keyof KanbanCardListContractProps | "aria-label">;
