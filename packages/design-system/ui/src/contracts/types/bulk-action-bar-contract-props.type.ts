/**
 * Stackra file contract:
 * Purpose: the props every runtime's `BulkActionBar` takes: how many records are selected, the actions to run on them,
 *          the clear handler, the "select all N" choice (`AllMatchingSelectionContractProps`) and the spoken names of
 *          the bar's parts. Each runtime's `BulkActionBarProps` is this plus its own base props.
 * Boundary: types only. The bar never changes the selection itself: it asks through `onClearSelection` and
 *           `onAllMatchingSelectedChange`, and the app clears the selection after an action succeeds. The bar draws
 *           nothing while `selectedCount` is 0 and `isAllMatchingSelected` is false.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0318 (decisions 4 to 6); ADR 0139 (action UX);
 *          WCAG 2.2 SC 4.1.3 (status messages).
 */
import type { AllMatchingSelectionContractProps } from "#contracts/types/all-matching-selection-contract-props.type";
import type { ResourceAction } from "#contracts/types/resource-action.type";

/** Props shared by the web and native `BulkActionBar`. */
export interface BulkActionBarContractProps extends AllMatchingSelectionContractProps {
  /** How many records are selected on screen; with `isAllMatchingSelected` the bar reads `totalCount` instead. */
  readonly selectedCount: number;
  /** The actions on the selection, in order; the handler of each closes over the selected keys. */
  readonly actions: readonly ResourceAction[];
  /** Called when the user presses the clear button; the app empties the selection. */
  readonly onClearSelection: () => void;
  /**
   * True when every record on screen is selected. "Select all N" is offered only then, and only with `totalCount`
   * above the selected count. Left out it is false, so a bar used on its own never offers the choice.
   */
  readonly isPageSelected?: boolean | undefined;
  /** The spoken name of the bar, for example "Order actions". Defaults to the `ui` catalogue's phrase in the active locale. */
  readonly label?: string | undefined;
  /** Writes the count as a sentence, for example "3 selected"; it is announced politely. Defaults to English. */
  readonly countLabel?: ((count: number) => string) | undefined;
  /** The text of the clear button. Defaults to the `ui` catalogue's word in the active locale. */
  readonly clearLabel?: string | undefined;
  /** Writes the "select all matching" button, for example "Select all 245". Defaults to English. */
  readonly selectAllLabel?: ((totalCount: number) => string) | undefined;
  /** Writes the button that goes back to the rows shown, for example "Select only the 20 shown". Defaults to English. */
  readonly selectShownLabel?: ((selectedCount: number) => string) | undefined;
  /** The accessible name of the native overflow button; web draws every action and has no overflow. */
  readonly moreActionsLabel?: string | undefined;
}
