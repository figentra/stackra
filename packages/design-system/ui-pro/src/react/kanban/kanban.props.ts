/**
 * Stackra file contract:
 * Purpose: `KanbanProps`, props of the web Kanban: the shared contract plus HeroUI Pro's own board props, passed
 *          through unchanged.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 4); ADR 0303 (decision 7); STA-403 FR-006.
 */
import type { KanbanRootProps as HeroKanbanRootProps } from "@heroui-pro/react/kanban";

import type { KanbanContractProps } from "#contracts/types/kanban-contract-props.type";

/** Props of the web Kanban: the shared contract plus HeroUI Pro's own board props, passed through unchanged. */
export type KanbanProps = KanbanContractProps &
  Omit<HeroKanbanRootProps, keyof KanbanContractProps>;
