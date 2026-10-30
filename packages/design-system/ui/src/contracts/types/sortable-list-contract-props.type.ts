/**
 * Stackra file contract:
 * Purpose: the props every runtime's `SortableList` takes: the rows in order, the callback that receives them in
 *          their new order, the list's accessible name, and an optional renderer of a row's content. Each runtime's
 *          `SortableListProps` is this plus its root element's own props, which pass through unchanged.
 * Boundary: types only. The list is controlled only: it keeps no copy of the order, so the app saves it.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); design-system gap inventory (2026-10-28) row 10;
 *          WCAG 2.2 SC 2.5.7 (dragging movements: every move has a single-pointer and keyboard alternative).
 */
import type { ReactNode } from "react";

import type { SortableListItem } from "#contracts/types/sortable-list-item.type";

/** Props shared by the web and native `SortableList`. */
export interface SortableListContractProps<TItem extends SortableListItem = SortableListItem> {
  /** The rows, in their current order. */
  readonly items: readonly TItem[];
  /** Called with every row in the new order after a move. */
  readonly onReorder: (items: readonly TItem[]) => void;
  /** The accessible name of the list, for example "Menu categories". */
  readonly label: string;
  /** Draws a row's content beside its drag handle; defaults to the label over the description. */
  readonly renderItem?: ((item: TItem) => ReactNode) | undefined;
  /** True to show the order but refuse every move. */
  readonly isDisabled?: boolean | undefined;
}
