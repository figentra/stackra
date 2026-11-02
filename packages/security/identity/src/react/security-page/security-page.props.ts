/**
 * Stackra file contract:
 * Purpose: `SecurityPageProps`, what a host hands the SecurityPage: the sections shown, the heading level, the passkey
 *          registration calls, the second-factor set-up, the step-up factors, what to do after ending every other
 *          session, and every word.
 * Boundary: an interface in its own file beside the component (ADR 0305). The data is the container's
 *           `AccountSecurity` port and adding a passkey its `Passkeys` port, never props; the words are the host's
 *           (ADR 0504 decision 4).
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0260 (client ports); ADR 0207 (decision 1); ADR 0305.
 */
import type { PasskeyCredential, PasskeyRegistrationChallenge } from "#contracts/index";
import type { StepUpDialogProps } from "#react/step-up-dialog/step-up-dialog.props";

/**
 * The security page's sections, calls and words.
 *
 * @example
 * <SecurityPage passkeyCalls={{ register: () => client.identity.passkey.register({}), confirm: (input) => client.identity.passkey.confirm(input) }} labels={labels} />
 */
export interface SecurityPageProps {
  /** The sections shown, in order; all four by default. */
  readonly sections?: readonly ("password" | "passkeys" | "two-factor" | "sessions")[] | undefined;
  /** The page heading's level; 1 by default, the sections one below it. */
  readonly headingLevel?: 1 | 2 | 3 | undefined;
  /** Called after every other session was ended. */
  readonly onSignOutEverywhere?: (() => void) | undefined;
  /**
   * The two calls of a passkey registration (`identity.passkey.register@1` and `confirm@1` on the host's client);
   * without them, or on a device without passkeys, there is no "add" action.
   */
  readonly passkeyCalls?:
    | {
        readonly register: () => Promise<PasskeyRegistrationChallenge>;
        readonly confirm: (input: {
          passkeyId: string;
          name: string;
          credential: PasskeyCredential;
        }) => Promise<unknown>;
      }
    | undefined;
  /** Starts the provider's hosted second-factor set-up; without it there is no "set up" action. */
  readonly onSetUpSecondFactor?: (() => void) | undefined;
  /** The factors the step-up dialog names when a change asks for one. */
  readonly stepUpMethods?: StepUpDialogProps["methods"];
  /** The page's words; the host writes them. */
  readonly labels: {
    readonly title: string;
    readonly description?: string | undefined;
    /** The spinner's spoken name while the settings load. */
    readonly loading: string;
    /** Shown when a load or a change fails. */
    readonly failed: string;
    /** Announced after a change succeeds, for example "Saved." */
    readonly saved: string;
    readonly password: {
      readonly title: string;
      /** The action that opens the form, for example "Change password". */
      readonly change: string;
      readonly current: string;
      readonly next: string;
      readonly save: string;
      /** Closes the form unsaved. */
      readonly cancel: string;
      /** Shown when the account has no password (passkeys or a provider only). */
      readonly none: string;
    };
    readonly passkeys: {
      readonly title: string;
      readonly add: string;
      /** The name a new passkey gets until the user renames it, for example "This device". */
      readonly newName: string;
      /** The remove button's words; its spoken name adds the passkey's name. */
      readonly remove: string;
      /** The words before a passkey's last use, for example "Last used". */
      readonly lastUsed: string;
      /** In place of the last use of a passkey never used, for example "Never used". */
      readonly never: string;
      readonly empty: string;
    };
    readonly twoFactor: {
      readonly title: string;
      readonly setUp: string;
      /** Each second factor's name. */
      readonly factors: {
        readonly totp: string;
        readonly otp_email: string;
        readonly otp_sms: string;
      };
      readonly none: string;
    };
    readonly sessions: {
      readonly title: string;
      /** The chip on this device's session, for example "This device". */
      readonly current: string;
      /** The end button's words; its spoken name adds the device. */
      readonly revoke: string;
      /** The action that ends every other session, for example "Sign out everywhere else". */
      readonly revokeOthers: string;
      /** The words before a session's last activity, for example "Last active". */
      readonly lastActive: string;
    };
    /** The step-up dialog's words, and why a change asks for it. */
    readonly stepUp: StepUpDialogProps["labels"] & { readonly reason: string };
  };
  /** Classes on the root. */
  readonly className?: string | undefined;
}
