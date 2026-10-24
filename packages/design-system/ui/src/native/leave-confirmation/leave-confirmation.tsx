/**
 * Stackra file contract:
 * Purpose: the native `LeaveConfirmation`: guards unsaved work. It asks "discard your changes?" through the native
 *          `AlertDialog` whenever the app calls `confirmLeave()` on its `ref`; the call resolves true if the user
 *          discards and false if they stay, and at once with true while `when` is false.
 * Boundary: router-free, which is the seam. There is no `beforeunload` on native, and `@stackra/ui` imports no
 *           navigation library, so the app's navigation code asks this component. With React Navigation that is a
 *           `beforeRemove` listener (or `usePreventRemove(when, ...)`) that calls `event.preventDefault()`, awaits
 *           `leave.current?.confirmLeave()` and, on true, runs `navigation.dispatch(event.data.action)`; the screen
 *           sets `gestureEnabled: false` while `when` holds so a swipe cannot skip the question. `@stackra/navigation`
 *           will own that binding. The Android back button and the cancel button stay on the screen. It draws the
 *           dialog only while asking.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0312; ADR 0055 (forms); WCAG 2.2 SC 3.3.4.
 */
import { useImperativeHandle, type ReactElement } from "react";

import type { LeaveConfirmationContractProps } from "#contracts/types/leave-confirmation-contract-props.type";
import { AlertDialog } from "#native/alert-dialog/alert-dialog";
import { usePendingChoice } from "#native/confirmation/use-pending-choice";

/** Props of the native LeaveConfirmation: the shared contract, which has no element of its own to pass props to. */
export type LeaveConfirmationProps = LeaveConfirmationContractProps;

/**
 * Asks "discard your changes?" when the app calls `confirmLeave()` on the `ref`. It does nothing while `when` is
 * false.
 */
export function LeaveConfirmation({
  when,
  title,
  description,
  stayLabel,
  discardLabel,
  ref,
}: LeaveConfirmationProps): ReactElement {
  const { isOpen, ask, settle } = usePendingChoice();

  useImperativeHandle(ref, () => ({ confirmLeave: () => (when ? ask() : Promise.resolve(true)) }), [
    when,
    ask,
  ]);

  return (
    <AlertDialog
      isOpen={isOpen}
      onOpenChange={(next) => {
        if (!next) settle(false);
      }}
      onConfirm={() => settle(true)}
      tone="danger"
      title={title}
      description={description}
      cancelLabel={stayLabel}
      confirmLabel={discardLabel}
    />
  );
}
