/**
 * Stackra file contract:
 * Purpose: `SetupGuideTask`, one task of a SetupGuide: its id, words, whether it is done and its call to action.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); ADR 0302 (decision 3); design-system gap inventory row 17.
 */

/** One task of a setup guide. */
export interface SetupGuideTask {
  /** The stable id the guide reports back in `onCompleteChange`. */
  readonly id: string;
  /** The task, for example "Add your first product". */
  readonly title: string;
  /** One line on why or how. */
  readonly description?: string | undefined;
  /** True once the task is done. */
  readonly isComplete: boolean;
  /** The text of the task's button, for example "Add product"; with `onAction` it is drawn while the task is open. */
  readonly actionLabel?: string | undefined;
  /** Called when the task's button is pressed. */
  readonly onAction?: (() => void) | undefined;
}
