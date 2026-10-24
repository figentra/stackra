/**
 * Stackra file contract:
 * Purpose: the props a collection takes to let the user select its items: the mode, the selected keys, and the change
 *          handler. Table and List extend it as it is; Tabs extends it without `selectionMode`, because a tab list
 *          always holds exactly one selected tab.
 * Boundary: types only. Keys are the items' `id`s as a list of strings: React Aria's `Set` and its `"all"` value are
 *           turned into one by `keysOfSelection`, so both runtimes report the same shape.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0313.
 */

/** Props shared by every selectable collection on web and native. */
export interface SelectionContractProps {
  /** What a press or Space does: nothing, select one item, or toggle several. Defaults to `none`. */
  readonly selectionMode?: "none" | "single" | "multiple" | undefined;
  /** The ids of the selected items, for a controlled collection; pair it with `onSelectionChange`. */
  readonly selectedKeys?: readonly string[] | undefined;
  /** The ids selected at the start, for an uncontrolled collection. */
  readonly defaultSelectedKeys?: readonly string[] | undefined;
  /** Called with the ids now selected each time the selection changes, in the order the items are in. */
  readonly onSelectionChange?: ((keys: readonly string[]) => void) | undefined;
}
