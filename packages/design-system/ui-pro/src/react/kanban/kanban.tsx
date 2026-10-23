/**
 * Stackra file contract:
 * Purpose: the web `Kanban` compound on HeroUI Pro's Kanban: the board root with the shared `size`, and the parts
 *          Column, ColumnHeader, ColumnTitle, ColumnCount, ColumnIndicator, ColumnActions, ColumnBody, CardList, Card,
 *          DropIndicator, DragHandle and ScrollShadow, with the `useKanban`, `useKanbanColumn` and
 *          `useKanbanCardPlaceholder` hooks that drive drag and drop.
 * Boundary: no styling or behaviour of its own; the look needs `@heroui-pro/react/css`. Imports the `kanban` subpath.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-403 FR-006.
 */
import {
  Kanban as HeroKanban,
  type KanbanRootProps as HeroKanbanRootProps,
} from "@heroui-pro/react/kanban";

import type { KanbanContractProps } from "#contracts/types/kanban-contract-props.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { KanbanCardList } from "#react/kanban/kanban-card-list";

/** Props of the web Kanban: the shared contract plus HeroUI Pro's own board props, passed through unchanged. */
export type KanbanProps = KanbanContractProps &
  Omit<HeroKanbanRootProps, keyof KanbanContractProps>;

/** The board root: HeroUI Pro's, a horizontally scrolling row of columns. */
function KanbanRoot({ size, ...rest }: KanbanProps) {
  return <HeroKanban.Root {...rest} {...omitUndefined({ size })} />;
}

/** The parts of the compound, typed from HeroUI Pro's own so the declaration output can name them. */
interface KanbanParts {
  /** One column of the board. */
  readonly Column: typeof HeroKanban.Column;
  /** The header of a column. */
  readonly ColumnHeader: typeof HeroKanban.ColumnHeader;
  /** The title of a column. */
  readonly ColumnTitle: typeof HeroKanban.ColumnTitle;
  /** The card count of a column. */
  readonly ColumnCount: typeof HeroKanban.ColumnCount;
  /** A coloured dot or icon before the column title. */
  readonly ColumnIndicator: typeof HeroKanban.ColumnIndicator;
  /** The actions at the end of a column header. */
  readonly ColumnActions: typeof HeroKanban.ColumnActions;
  /** The scrollable body of a column. */
  readonly ColumnBody: typeof HeroKanban.ColumnBody;
  /** The list of cards in a column, named by `label`. */
  readonly CardList: typeof KanbanCardList;
  /** One card. */
  readonly Card: typeof HeroKanban.Card;
  /** The placeholder shown where a dragged card will drop. */
  readonly DropIndicator: typeof HeroKanban.DropIndicator;
  /** The handle a card is dragged by. */
  readonly DragHandle: typeof HeroKanban.DragHandle;
  /** A scroll shadow for a column body. */
  readonly ScrollShadow: typeof HeroKanban.ScrollShadow;
}

/**
 * A kanban board: `Kanban.Column` holds `ColumnHeader` and `ColumnBody` with a `CardList` of `Card`, and the
 * `useKanban` hook moves cards between columns.
 */
export const Kanban: typeof KanbanRoot & KanbanParts = Object.assign(KanbanRoot, {
  Column: HeroKanban.Column,
  ColumnHeader: HeroKanban.ColumnHeader,
  ColumnTitle: HeroKanban.ColumnTitle,
  ColumnCount: HeroKanban.ColumnCount,
  ColumnIndicator: HeroKanban.ColumnIndicator,
  ColumnActions: HeroKanban.ColumnActions,
  ColumnBody: HeroKanban.ColumnBody,
  CardList: KanbanCardList,
  Card: HeroKanban.Card,
  DropIndicator: HeroKanban.DropIndicator,
  DragHandle: HeroKanban.DragHandle,
  ScrollShadow: HeroKanban.ScrollShadow,
});

export { useKanban, useKanbanCardPlaceholder, useKanbanColumn } from "@heroui-pro/react/kanban";
