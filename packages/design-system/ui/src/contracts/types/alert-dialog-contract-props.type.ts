/**
 * Stackra file contract:
 * Purpose: the props every runtime's `AlertDialog` takes: a modal that interrupts the user to confirm or refuse one
 *          decision, named by a required title, with a required label on each of its two buttons. It extends the
 *          dismissal and open-state props of every overlay and the tone and icon of every message.
 * Boundary: types only. HeroUI Native has no AlertDialog, so native draws it on its Dialog (the adapted form), and the
 *           props are the same on both. A dialog with a form or a list in it is a Modal, not an AlertDialog.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0312; WAI-ARIA `alertdialog`; WCAG 2.2
 *          SC 2.1.2, 3.3.4 and 4.1.2.
 */
import type { ReactNode } from "react";

import type { FeedbackContractProps } from "#contracts/types/feedback-contract-props.type";
import type { OverlayContractProps } from "#contracts/types/overlay-contract-props.type";

/**
 * Props shared by the web and native `AlertDialog`. Unlike the other overlays, `isDismissable` defaults to false here
 * (a stray press outside must not decide a question) and Escape, or the Android back button, refuses the question
 * unless `isKeyboardDismissDisabled` is set.
 */
export interface AlertDialogContractProps extends OverlayContractProps, FeedbackContractProps {
  /** The question, required: it names the dialog for assistive technology, so word it as a decision. */
  readonly title: ReactNode;
  /** What the decision does, read out with the dialog; text, because it is what the dialog is described by. */
  readonly description?: ReactNode;
  /** Anything more the decision needs, shown under the description: a field to type a name into, say. */
  readonly children?: ReactNode;
  /** The label of the button that agrees, in the app's language, for example "Delete project". */
  readonly confirmLabel: string;
  /** The label of the button that refuses, in the app's language, for example "Keep project". It takes focus first. */
  readonly cancelLabel: string;
  /** True to refuse the confirming press until the decision is ready, as when the user must still type a name. */
  readonly isConfirmDisabled?: boolean | undefined;
  /** Called when the user confirms, just before the dialog closes. */
  readonly onConfirm?: (() => void) | undefined;
  /** Called when the user refuses: the cancel button, Escape or the Android back button, or a press outside. */
  readonly onCancel?: (() => void) | undefined;
}
