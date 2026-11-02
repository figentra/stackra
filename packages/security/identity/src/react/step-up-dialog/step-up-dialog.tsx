/**
 * Stackra file contract:
 * Purpose: `StepUpDialog`, the identity kit's step-up: a modal that says why a fresh authentication is needed and which
 *          factors are accepted, and on "verify" runs the session's step-up sign-in; once it returns the dialog closes
 *          and `onVerified` runs, so the host retries the refused call.
 * Boundary: composition of @stackra/ui's `Modal` over `useSession`. The verification is `signIn(stepUpSignIn())`
 *           (`prompt=login`, `max_age=0`): the provider's hosted page asks for the factor its MFA policy sets, so the
 *           dialog takes no code or password itself. A cancelled sign-in leaves it open and quiet; any other failure
 *           shows the host's `failed` words in an alert. With the BFF the page leaves for the provider and comes back,
 *           so `onVerified` runs only where the sign-in returns in place (the PKCE flow, a popup).
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0207 (decision 1); ADR 0206 (decision 8); ADR 0165 (UI through
 *                     @stackra/ui).
 */
import { Alert, Button, Modal, Text } from "@stackra/ui/react";
import { type ReactElement, useState } from "react";

import { SignInCancelledError, stepUpSignIn } from "#core/index";
import { useSession } from "#react/session/use-session";
import type { StepUpDialogProps } from "#react/step-up-dialog/step-up-dialog.props";
import type { StepUpMethod } from "#react/step-up-dialog/step-up-method.type";

/** No factors named. */
const NONE: readonly StepUpMethod[] = [];

/**
 * The step-up dialog.
 *
 * @example
 * <StepUpDialog isOpen={isOpen} onOpenChange={setOpen} reason={labels.reason} onVerified={retry} labels={labels} />
 */
export function StepUpDialog({
  isOpen,
  onOpenChange,
  methods = NONE,
  reason,
  onVerified,
  labels,
}: StepUpDialogProps): ReactElement {
  const session = useSession();
  const [isPending, setPending] = useState(false);
  const [isFailed, setFailed] = useState(false);
  const verify = async () => {
    setPending(true);
    setFailed(false);
    try {
      await session.signIn(stepUpSignIn());
      onOpenChange?.(false);
      onVerified?.();
    } catch (error) {
      if (!(error instanceof SignInCancelledError)) setFailed(true);
    } finally {
      setPending(false);
    }
  };
  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(next) => {
        if (!next) setFailed(false);
        onOpenChange?.(next);
      }}
      size="sm"
      onConfirm={() => void verify()}
    >
      <Modal.Header>
        <Modal.Title>{labels.title}</Modal.Title>
      </Modal.Header>
      <Modal.Body className="flex flex-col gap-3">
        {reason && <Text>{reason}</Text>}
        {methods.length > 0 && (
          <div className="flex flex-col gap-1">
            <Text tone="muted" type="small">
              {labels.methodsIntro}
            </Text>
            <ul className="list-disc ps-5">
              {methods.map((method) => (
                <li key={method}>
                  <Text elementType="span">{labels.methods[method]}</Text>
                </li>
              ))}
            </ul>
          </div>
        )}
        {isFailed && <Alert tone="danger" title={labels.failed} />}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" isDisabled={isPending} onPress={() => onOpenChange?.(false)}>
          {labels.cancel}
        </Button>
        <Button isLoading={isPending} onPress={() => void verify()}>
          {labels.verify}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
