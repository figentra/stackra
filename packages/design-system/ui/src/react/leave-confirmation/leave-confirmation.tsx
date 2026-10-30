/**
 * Stackra file contract:
 * Purpose: the web `LeaveConfirmation`: guards unsaved work. While `when` is true it makes the browser ask before the
 *          tab closes, reloads or navigates away (a `beforeunload` listener), and it asks "discard your changes?"
 *          through an `AlertDialog` whenever the app calls `confirmLeave()` on its `ref`; the call resolves true if
 *          the user discards and false if they stay, and at once with true while `when` is false.
 * Boundary: router-free, which is the seam. `@stackra/ui` imports no router, so nothing here blocks a route change by
 *           itself: the app's navigation code does, and asks this component. With React Router that is
 *           `const blocker = useBlocker(when)` and an effect that, once `blocker.state === "blocked"`, awaits
 *           `leave.current?.confirmLeave()` and calls `blocker.proceed()` on true and `blocker.reset()` on false;
 *           `@stackra/navigation` will own that binding. The browser's own `beforeunload` prompt cannot carry our
 *           words, a rule of the platform, so only the in-app question is translated. Escape and the cancel button
 *           stay on the page; a press outside does not decide. It draws the dialog only while asking.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0312; ADR 0055 (forms); WCAG 2.2 SC 3.3.4.
 */
import { useEffect, useImperativeHandle, type ReactElement } from "react";

import { AlertDialog } from "#react/alert-dialog/alert-dialog";
import { usePendingChoice } from "#react/hooks/use-pending-choice";
import type { LeaveConfirmationProps } from "#react/leave-confirmation/leave-confirmation.props";

/**
 * Warns before unsaved work is lost: the browser's own prompt on a tab close or reload, and this dialog when the app
 * calls `confirmLeave()` on the `ref`. It does nothing while `when` is false.
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

  useEffect(() => {
    if (!when) return undefined;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Older browsers read `returnValue` and not `preventDefault`; the text is ignored by every modern one.
      // oxlint-disable-next-line no-param-reassign -- the beforeunload contract is to set returnValue on the event
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [when]);

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
