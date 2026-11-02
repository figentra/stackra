/**
 * Stackra file contract:
 * Purpose: `PasswordResetProps`, what a host hands the PasswordReset block: the step, the emailed token, the two calls
 *          it makes, the password policy to show, what to do when done, and every word.
 * Boundary: an interface in its own file beside the component (ADR 0305). The block calls nothing itself: the host
 *           binds `onRequest` and `onReset` to its generated client or the provider's API, as SignIn hands its form to
 *           `onSubmit`. The words are the host's (ADR 0504 decision 4).
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0206; ADR 0207 (decision 3); ADR 0305.
 */
import type { HeadingLevel } from "@stackra/ui/contracts";

import type { PasswordPolicy } from "#contracts/types/password-policy.type";
import type { PasswordPolicyChecklistProps } from "#react/password-policy-checklist/password-policy-checklist.props";

/**
 * The reset block's step, calls and words.
 *
 * @example
 * <PasswordReset step="reset" token={params.token} onReset={(input) => client.identity.password.reset(input)} onDone={() => navigate("/sign-in")} labels={labels} />
 */
export interface PasswordResetProps {
  /** Ask for the email, or set the new password from the emailed token. */
  readonly step: "request" | "reset";
  /** The reset token (step `reset`); without it the block says the link is not valid. */
  readonly token?: string | undefined;
  /** Sends the reset email (step `request`); it resolves whether or not the address has an account. */
  readonly onRequest?: ((email: string) => Promise<void>) | undefined;
  /** Sets the new password from the token (step `reset`). */
  readonly onReset?:
    | ((input: { readonly token: string; readonly password: string }) => Promise<void>)
    | undefined;
  /** The rules a new password must meet, checked as the user types (step `reset`) with `labels.rules`. */
  readonly policy?: PasswordPolicy | undefined;
  /** Called after the email is sent or the password is set. */
  readonly onDone?: (() => void) | undefined;
  /** The title's level in the page outline: 2 by default; 1 when the card is the whole page. */
  readonly headingLevel?: HeadingLevel | undefined;
  /** The block's words; the host writes them. */
  readonly labels: {
    /** The card's title, for example "Reset your password". */
    readonly title: string;
    /** The line under the title. */
    readonly description?: string | undefined;
    /** The email field (step `request`). */
    readonly email: string;
    /** The new password field (step `reset`). */
    readonly password: string;
    /** The submit button, for example "Send link" or "Set password". */
    readonly submit: string;
    /** Shown once the email is sent, for example "If an account uses that address, we sent it a link." */
    readonly sent: string;
    /** Shown when a call fails or the link is not valid, for example "That didn't work. Ask for a new link." */
    readonly failed: string;
    /** The checklist's words, shown with `policy`. */
    readonly rules?: PasswordPolicyChecklistProps["labels"] | undefined;
  };
  /** Classes on the root. */
  readonly className?: string | undefined;
}
