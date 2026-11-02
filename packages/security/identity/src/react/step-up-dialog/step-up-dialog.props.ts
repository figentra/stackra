/**
 * Stackra file contract:
 * Purpose: `StepUpDialogProps`, what a host hands the StepUpDialog: whether it is open, the factors accepted, why it
 *          asks, what to do once verified, and every word.
 * Boundary: an interface in its own file beside the component (ADR 0305). The verification is the container's
 *           `SessionService` running `stepUpSignIn`, never a prop; the words are the host's (ADR 0504 decision 4).
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0207 (decision 1); ADR 0305.
 */
import type { StepUpMethod } from "#react/step-up-dialog/step-up-method.type";

/**
 * The step-up dialog's state, handlers and words.
 *
 * @example
 * <StepUpDialog isOpen={isOpen} onOpenChange={setOpen} methods={["passkey", "totp"]} onVerified={retry} labels={labels} />
 */
export interface StepUpDialogProps {
  /** Whether the dialog is open; the host opens it on a `step_up_required` refusal. */
  readonly isOpen?: boolean | undefined;
  /** Called when the dialog asks to open or close (Escape, cancel, verified). */
  readonly onOpenChange?: ((isOpen: boolean) => void) | undefined;
  /** The factors accepted, named in the dialog; left out, none are named and the provider's policy decides. */
  readonly methods?: readonly StepUpMethod[] | undefined;
  /** Why the step-up is asked, for example "Changing your password needs a fresh sign-in." */
  readonly reason?: string | undefined;
  /** Called once the session authenticated again (retry the refused call). */
  readonly onVerified?: (() => void) | undefined;
  /** The dialog's words; the host writes them. */
  readonly labels: {
    /** The dialog's title and name, for example "Confirm it's you". */
    readonly title: string;
    /** The line before the accepted factors, for example "You can use:". */
    readonly methodsIntro: string;
    /** Each factor's name, for example `{ passkey: "A passkey", totp: "An authenticator code" }`. */
    readonly methods: Readonly<Record<StepUpMethod, string>>;
    /** The button that starts the re-authentication, for example "Continue". */
    readonly verify: string;
    /** The button that closes the dialog, for example "Cancel". */
    readonly cancel: string;
    /** Shown when the re-authentication fails, for example "We couldn't verify you. Try again." */
    readonly failed: string;
  };
}
