/**
 * Stackra file contract:
 * Purpose: `SortableListProps`, the props of the web `SortableList` in `sortable-list.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0165 (React
 *          Aria on web); design-system gap inventory (2026-10-28) row 10.
 */
import type { GridListProps } from "react-aria-components";

import type { SortableListContractProps } from "#contracts/types/sortable-list-contract-props.type";
import type { SortableListItem } from "#contracts/types/sortable-list-item.type";

/**
 * Props of the web SortableList: the shared contract plus React Aria's `GridList` props, passed through to the
 * root. The list draws its own rows and owns the drag and drop, so children and the drag hooks are refused, `label`
 * owns the accessible name, and the class is a plain string.
 */
export type SortableListProps<TItem extends SortableListItem = SortableListItem> =
  SortableListContractProps<TItem> &
    Omit<
      GridListProps<TItem>,
      | keyof SortableListContractProps<TItem>
      | "children"
      | "aria-label"
      | "className"
      | "dragAndDropHooks"
      | "disabledKeys"
    > & {
      /** Classes added to the list's root. */
      readonly className?: string | undefined;
    };
