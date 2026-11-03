/**
 * Stackra file contract:
 * Purpose: `SignUpProps`, what a host hands the SignUp block: the steps, the providers, the terms and privacy links,
 *          the call each step makes, the password policy to show, what to do with the new session, and every word.
 * Boundary: an interface in its own file beside the component (ADR 0305). The block creates nothing itself: each
 *           step's call is the host's (its generated client, or the provider's registration), and the last one leaves
 *           the user signed in, which the block reads from the container's `SessionService`. The words are the host's
 *           (ADR 0504 decision 4).
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0206 (identity, provider-neutral); ADR 0207 (decision 3); ADR 0305.
 */
import type { HeadingLevel, SocialProvider } from "@stackra/ui/contracts";

import type { PasswordPolicy } from "#contracts/types/password-policy.type";
import type { PasswordPolicyChecklistProps } from "#react/password-policy-checklist/password-policy-checklist.props";
import type { SignedInSession } from "#react/session/signed-in-session.type";

/**
 * The sign-up block's steps, calls and words.
 *
 * @example
 * <SignUp providers={providers} onProvider={redirectTo} onAccount={register} onVerify={confirm} onSignedUp={() => navigate("/")} labels={labels} />
 */
export interface SignUpProps {
  /** The steps shown, in order; `account` then `verify` by default. */
  readonly steps?: readonly ("account" | "verify" | "organization")[] | undefined;
  /** The external providers, in the order shown; none hides the buttons and the divider. */
  readonly providers: readonly SocialProvider[];
  /** A provider button was pressed; the host starts that provider's redirect. */
  readonly onProvider?: ((providerId: string) => void) | undefined;
  /** Creates the account (step `account`). */
  readonly onAccount?:
    | ((values: {
        readonly name: string;
        readonly email: string;
        readonly password: string;
      }) => Promise<void>)
    | undefined;
  /** Checks the code emailed to the new address (step `verify`). */
  readonly onVerify?: ((code: string) => Promise<void>) | undefined;
  /** Creates the user's first organisation (step `organization`). */
  readonly onOrganization?: ((values: { readonly name: string }) => Promise<void>) | undefined;
  /** The rules a new password must meet, checked as the user types with `labels.rules`. */
  readonly policy?: PasswordPolicy | undefined;
  /** The terms link; with `privacyHref`, the agreement line shows under the form. */
  readonly termsHref?: string | undefined;
  /** The privacy link. */
  readonly privacyHref?: string | undefined;
  /** Called with the new session once the last step is done and the user is signed in. */
  readonly onSignedUp?: ((session: SignedInSession) => void) | undefined;
  /** The title's level in the page outline: 2 by default; 1 when the card is the whole page. */
  readonly headingLevel?: HeadingLevel | undefined;
  /** The block's words; the host writes them. */
  readonly labels: {
    readonly title: string;
    readonly description?: string | undefined;
    /** The stepper's spoken name, for example "Sign-up progress". */
    readonly progress: string;
    /** Each step's name on the stepper. */
    readonly steps: {
      readonly account: string;
      readonly verify: string;
      readonly organization: string;
    };
    readonly name: string;
    readonly email: string;
    readonly password: string;
    /** The code field (step `verify`), for example "Code from your email". */
    readonly code: string;
    /** The organisation's name field (step `organization`). */
    readonly organization: string;
    /** The button of every step but the last, for example "Continue". */
    readonly next: string;
    /** The last step's button, for example "Create account". */
    readonly submit: string;
    /** Between the providers and the form: "or". */
    readonly divider: string;
    /** The agreement line's words before the links, for example "By continuing you agree to the". */
    readonly agreement: string;
    readonly terms: string;
    /** The word between the two links, for example "and". */
    readonly and: string;
    readonly privacy: string;
    /** Shown when a step's call fails, for example "We couldn't do that. Check the details and try again." */
    readonly failed: string;
    /** The checklist's words, shown with `policy`. */
    readonly rules?: PasswordPolicyChecklistProps["labels"] | undefined;
  };
  /** Classes on the root. */
  readonly className?: string | undefined;
}
