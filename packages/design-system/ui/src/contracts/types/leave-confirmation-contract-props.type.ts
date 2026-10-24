/**
 * Stackra file contract:
 * Purpose: the props every runtime's `LeaveConfirmation` takes: whether there is unsaved work (`when`), the words of
 *          the "discard your changes?" dialog, and a `ref` to ask it through. It is router-free: the app's navigation
 *          code (React Router's `useBlocker`, React Navigation's `beforeRemove`) calls `confirmLeave` and acts on the
 *          answer, a binding that `@stackra/navigation` will own.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0312; WCAG 2.2 SC 3.3.4.
 */
import type { ReactNode, Ref } from "react";

import type { LeaveConfirmationHandle } from "#contracts/types/leave-confirmation-handle.type";

/** Props shared by the web and native `LeaveConfirmation`. */
export interface LeaveConfirmationContractProps {
  /** True while there is unsaved work; false means leaving costs nothing and `confirmLeave` never asks. */
  readonly when: boolean;
  /** The question, required, for example "Discard unsaved changes?". */
  readonly title: ReactNode;
  /** What leaving costs, read out with the dialog, for example "Your edits to this page will be lost.". */
  readonly description?: ReactNode;
  /** The label of the button that stays on the page, in the app's language. It takes focus first. */
  readonly stayLabel: string;
  /** The label of the button that leaves and drops the changes, in the app's language. */
  readonly discardLabel: string;
  /** Receives the handle with `confirmLeave`. */
  readonly ref?: Ref<LeaveConfirmationHandle> | undefined;
}
