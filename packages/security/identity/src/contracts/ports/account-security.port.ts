/**
 * Stackra file contract:
 * Purpose: the `AccountSecurity` port: the signed-in user's own security settings as the SecurityPage reads and
 *          changes them: whether a password and which second factors are set up, the passkeys, the device sessions,
 *          changing the password, renaming or removing a passkey, and ending one or every other session.
 * Boundary: an abstract class that is its own token, keyed `identity.AccountSecurity`; a client port (ADR 0260) the app
 *           binds to its generated client. It acts on the caller only and takes no user id. A sensitive call (the
 *           password, removing a passkey) refuses with `step_up_required` (`StepUpRequiredError`) when the session's
 *           assurance is too old or too weak; the page then runs a step-up and retries. Adding a passkey is the
 *           `Passkeys` port with `registerPasskey`, and setting up a second factor is the provider's hosted flow, so
 *           neither is here. Drivers: `MemoryAccountSecurityDriver` (`./testing`).
 * Runtime: isomorphic
 * Governing contract: ADR 0260 (client ports); ADR 0207 (decision 1: step-up); ADR 0206 (decision 8); ADR 0504.
 */
import { Port } from "@stackra/contracts";

import type { AccountSecurityOverview } from "#contracts/types/account-security-overview.type";
import type { AccountSession } from "#contracts/types/account-session.type";

/**
 * The signed-in user's security settings.
 *
 * @example
 * const security = useContainer().get(AccountSecurity);
 * const { passkeys } = await security.overview();
 */
export abstract class AccountSecurity extends Port {
  /** Type-only port key, so `DriverName<AccountSecurity>` narrows to this port's drivers. */
  declare readonly "~key": "identity.AccountSecurity";

  /** Whether a password is set, the second factors set up and the passkeys. */
  abstract overview(): Promise<AccountSecurityOverview>;

  /**
   * Replaces the password.
   *
   * @throws StepUpRequiredError when the session must authenticate again first.
   */
  abstract changePassword(input: {
    readonly current: string;
    readonly next: string;
  }): Promise<void>;

  /**
   * Removes the passkey `id`.
   *
   * @throws StepUpRequiredError when the session must authenticate again first.
   */
  abstract removePasskey(id: string): Promise<void>;

  /** Renames the passkey `id`. */
  abstract renamePasskey(input: { readonly id: string; readonly name: string }): Promise<void>;

  /** The user's device sessions, this one marked `isCurrent`. */
  abstract sessions(): Promise<readonly AccountSession[]>;

  /** Ends the device session `id`. */
  abstract revokeSession(id: string): Promise<void>;

  /** Ends every device session but this one. */
  abstract revokeOtherSessions(): Promise<void>;
}
