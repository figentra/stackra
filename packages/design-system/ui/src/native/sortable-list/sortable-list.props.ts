/**
 * Stackra file contract:
 * Purpose: `SortableListProps`, the props of the native `SortableList` in `sortable-list.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); design-system gap
 *          inventory (2026-10-28) row 10.
 */
import type { ViewProps } from "react-native";
import type { SortableListContractProps } from "#contracts/types/sortable-list-contract-props.type";
import type { SortableListItem } from "#contracts/types/sortable-list-item.type";
import type { SortableRowAction } from "#native/sortable-list/sortable-row-action.type";

/**
 * Props of the native SortableList: the shared contract plus a `View`'s props, passed through to the root. The list
 * draws its own rows, and `label` owns the accessible name.
 */
export type SortableListProps<TItem extends SortableListItem = SortableListItem> =
  SortableListContractProps<TItem> & {
    /**
     * More screen-reader actions for a row, beside "Move up" and "Move down": a row is one element to VoiceOver and
     * TalkBack, so a control drawn inside it (a checkbox, a button) is reached through one of these.
     */
    readonly accessibilityActionsOf?: ((item: TItem) => readonly SortableRowAction[]) | undefined;
  } & Omit<
      ViewProps,
      | keyof SortableListContractProps<TItem>
      | "children"
      | "accessibilityLabel"
      | "accessibilityRole"
    >;
