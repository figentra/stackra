/**
 * Stackra file contract:
 * Purpose: the web `ConfirmationProvider`: renders the one `AlertDialog` that every `confirm` call of
 *          `useConfirmation()` uses, so a handler asks a question with an `await` and no dialog state of its own. A
 *          question with `confirmationText` also draws a `TextField`, and the confirming button stays disabled until
 *          the user has typed that text.
 * Boundary: one dialog at a time: a question asked while another is open refuses the first (it resolves false) and
 *           takes its place, which a user who is looking at a dialog cannot cause. The dialog is Escape-dismissible
 *           and not press-outside-dismissible, as every AlertDialog is by default. Mount it once, inside the
 *           `DesignSystemProvider`, so the dialog follows the app's locale and scheme.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0312; WCAG 2.2 SC 3.3.4.
 */
import { useCallback, useState, type ReactElement } from "react";

import type { ConfirmFunction } from "#contracts/types/confirm-function.type";
import type { ConfirmationOptions } from "#contracts/types/confirmation-options.type";
import { AlertDialog } from "#react/alert-dialog/alert-dialog";
import { ConfirmationContext } from "#react/confirmation/confirmation-context";
import { usePendingChoice } from "#react/hooks/use-pending-choice";
import { TextField } from "#react/text-field/text-field";
import type { ConfirmationProviderProps } from "#react/confirmation/confirmation-provider.props";

/** Makes `useConfirmation()` available to the app below it and draws the dialog it asks through. */
export function ConfirmationProvider({ children }: ConfirmationProviderProps): ReactElement {
  const { request, isOpen, ask, settle } = usePendingChoice<ConfirmationOptions>();
  const [typed, setTyped] = useState("");

  // Each question starts with an empty field, so a name typed for one never unlocks the next.
  const confirm = useCallback<ConfirmFunction>(
    (options) => {
      setTyped("");
      return ask(options);
    },
    [ask],
  );

  return (
    <ConfirmationContext value={confirm}>
      {children}
      {request === undefined ? null : (
        <AlertDialog
          isOpen={isOpen}
          // Confirming settles true first; the close it causes then reaches here and finds nothing left to answer.
          onOpenChange={(next) => {
            if (!next) settle(false);
          }}
          onConfirm={() => settle(true)}
          title={request.title}
          description={request.description}
          confirmLabel={request.confirmLabel}
          cancelLabel={request.cancelLabel}
          tone={request.tone}
          icon={request.icon}
          isConfirmDisabled={
            request.confirmationText !== undefined && typed.trim() !== request.confirmationText
          }
        >
          {request.confirmationText === undefined ? null : (
            <TextField
              label={request.confirmationLabel}
              value={typed}
              onChange={setTyped}
              autoComplete="off"
            />
          )}
        </AlertDialog>
      )}
    </ConfirmationContext>
  );
}
