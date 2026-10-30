/**
 * Stackra file contract:
 * Purpose: `SortableRowAction`, one more screen-reader action of a native `SortableList` row (for example "Hide
 *          Price"), beside its own "Move up" and "Move down".
 * Boundary: types only; `SortableListProps.accessibilityActionsOf` returns them per row.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rule 12: one declaration per file); STA-1371; WCAG 2.2 SC 4.1.2.
 */

/** A named action a screen reader offers on a row. */
export interface SortableRowAction {
  /** The action's id, unique in the row; never `move_up` or `move_down`. */
  readonly name: string;
  /** What VoiceOver and TalkBack read, in the active locale. */
  readonly label: string;
  /** Runs the action. */
  readonly onAction: () => void;
}
