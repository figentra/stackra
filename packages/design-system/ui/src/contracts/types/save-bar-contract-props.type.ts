/**
 * Stackra file contract:
 * Purpose: the props every runtime's `SaveBar` takes: whether the form is dirty, the save and discard handlers, the
 *          busy state, the attention signal and the words of the bar. Each runtime's `SaveBarProps` is this plus its
 *          own base props.
 * Boundary: types only. The bar never holds the form's values: the app says when it is dirty, saves and discards. It
 *           draws nothing while `isDirty` is false. LeaveConfirmation still guards navigation; the app bumps
 *           `attentionKey` when it blocked one, so the bar shakes.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0139 (action UX); WCAG 2.2 SC 4.1.3;
 *          design-system gap inventory row 8.
 */
import type { ReactNode } from "react";

/** Props shared by the web and native `SaveBar`. */
export interface SaveBarContractProps {
  /** True while the form has unsaved changes; the bar slides in then and out once it is false again. */
  readonly isDirty: boolean;
  /** Called when the user presses Save; a returned promise keeps the button busy until it settles. */
  readonly onSave: () => void | Promise<void>;
  /** Called when the user presses Discard; the app restores the saved values. */
  readonly onDiscard: () => void;
  /** True while a save runs that the bar did not start (a form library's submit); Save shows busy. */
  readonly isSaving?: boolean | undefined;
  /** True to refuse Save, for example while the form is invalid; Discard stays available. */
  readonly isSaveDisabled?: boolean | undefined;
  /**
   * Change it to call the user's eye to the bar: it shakes (and plays a warning haptic on native), for example when
   * LeaveConfirmation blocked a navigation while the form was dirty. Reduced motion skips the shake.
   */
  readonly attentionKey?: number | undefined;
  /** The message, for example "Unsaved product changes". Defaults to the `ui` catalogue's "Unsaved changes". */
  readonly message?: string | undefined;
  /** The text of the save button. Defaults to the `ui` catalogue's "Save". */
  readonly saveLabel?: string | undefined;
  /** The text of the discard button. Defaults to the `ui` catalogue's "Discard". */
  readonly discardLabel?: string | undefined;
  /** The spoken name of the bar. Defaults to the `ui` catalogue's "Unsaved changes". */
  readonly label?: string | undefined;
  /** Extra content between the message and the buttons, usually a `SaveStatus`. */
  readonly children?: ReactNode;
}
