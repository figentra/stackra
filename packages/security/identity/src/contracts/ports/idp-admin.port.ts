/**
 * Stackra file contract:
 * Purpose: the `IdpAdmin` port: run-time administration of the identity provider: create human and machine users,
 *          deactivate and remove a user, list a user's live sessions, end one session or every session of a user, run the OAuth device flow, and set
 *          an organisation's login policy; read which authentication methods a user has enrolled (as RFC 8176 `amr`
 *          codes, so `assuranceOf` turns them into the MFA level the security page's enrolment list needs); find the
 *          provider's user of a Stackra user id; and the server half of passkeys (the sign-in challenge and its check
 *          on a provider session, the registration options and their check).
 * Boundary: an abstract class that is its own token. The ZITADEL driver calls the provider's APIs with the service
 *           account token `IdpAdminConfig` reads from the secret store (managed ZITADEL or the tenant's own instance,
 *           by `IdpAdminConfig.url`); the memory driver serves tests. Server only in use: it holds an admin credential.
 *           Which users, policies and sessions to touch is the identity service's actions and settings, never this
 *           port. Ending a session that is already gone is not an error. A passkey call never touches the device:
 *           the options go to the `Passkeys` port and its credential comes back here unread.
 * Runtime: isomorphic
 * Governing contract: ADR 0206; ADR 0207; ADR 0235 (decision 1); RFC 8628; ADR 0410 (STA-834); RFC 8176; STA-1264 (MFA
 *                     enrolment); STA-1538 (passkeys); STA-1543 (erasure); STA-1580
 *                     (session list).
 */
import { Port } from "@stackra/contracts";

import type { DeviceAuthorization } from "#contracts/types/device-authorization.type";
import type { DeviceTokenResult } from "#contracts/types/device-token-result.type";
import type { IdpMachineCredential } from "#contracts/types/idp-machine-credential.type";
import type { IdpMachineUserInput } from "#contracts/types/idp-machine-user-input.type";
import type { IdpUserInput } from "#contracts/types/idp-user-input.type";
import type { IdpSession } from "#contracts/types/idp-session.type";
import type { IdpSessionGrant } from "#contracts/types/idp-session-grant.type";
import type { LoginPolicy } from "#contracts/types/login-policy.type";
import type { PasskeyCredential } from "#contracts/types/passkey-credential.type";
import type { PasskeyRegistrationChallenge } from "#contracts/types/passkey-registration-challenge.type";
import type { PasskeySignInChallenge } from "#contracts/types/passkey-sign-in-challenge.type";

/**
 * Administers the identity provider.
 *
 * @example
 * const { userId, clientId, clientSecret } = await idp.createMachineUser({ organizationId, username, name });
 */
export abstract class IdpAdmin extends Port {
  /**
   * Creates a human user and resolves to the provider's user id.
   *
   * @throws IdpUserExistsError when the username is taken in the organisation.
   * @throws IdpAdminUnavailableError when the provider cannot be reached or fails.
   */
  abstract createUser(input: IdpUserInput): Promise<string>;

  /**
   * Creates a machine user with a client-credentials pair.
   *
   * @throws IdpUserExistsError when the username is taken in the organisation.
   * @throws IdpAdminUnavailableError when the provider cannot be reached or fails.
   */
  abstract createMachineUser(input: IdpMachineUserInput): Promise<IdpMachineCredential>;

  /** Deactivates `userId`: it can no longer sign in, and its record stays. */
  abstract deactivateUser(userId: string): Promise<void>;

  /** Removes `userId` from the provider. */
  abstract removeUser(userId: string): Promise<void>;

  /**
   * The live sessions of `userId`, every page of them; an unknown user has none.
   *
   * @throws IdpAdminUnavailableError when the provider cannot be reached or fails.
   */
  abstract listSessions(userId: string): Promise<readonly IdpSession[]>;

  /** Ends one session; a session already gone is not an error. */
  abstract endSession(sessionId: string): Promise<void>;

  /** Ends every session of `userId`, resolving to how many were ended. */
  abstract endSessions(userId: string): Promise<number>;

  /** Starts a device flow for the public client `clientId` with `scopes`. */
  abstract startDeviceAuthorization(
    clientId: string,
    scopes: readonly string[],
  ): Promise<DeviceAuthorization>;

  /** Polls a device flow once. */
  abstract pollDeviceToken(clientId: string, deviceCode: string): Promise<DeviceTokenResult>;

  /**
   * The authentication methods `userId` has enrolled, as RFC 8176 `amr` codes (`pwd`, `otp`, `sms`, `swk`, `hwk`,
   * `fed`), without duplicates; `assuranceOf({ amr }, identity)` gives the strongest level they reach.
   *
   * @throws IdpAdminUnavailableError when the provider cannot be reached or fails.
   */
  abstract listAuthMethods(userId: string): Promise<readonly string[]>;

  /**
   * Sets `organizationId`'s login policy to `policy`; when the policy lists `externalProviderIds` or `secondFactors`,
   * the organisation offers exactly those afterwards.
   */
  abstract setLoginPolicy(organizationId: string, policy: LoginPolicy): Promise<void>;

  /**
   * The provider's user id of the Stackra user `stackraUserId` (`usr_…`), or `undefined` when the provider has none.
   *
   * @throws IdpAdminUnavailableError when the provider cannot be reached or fails.
   */
  abstract findUserId(stackraUserId: string): Promise<string | undefined>;

  /**
   * Opens a provider session for the login name `loginName` with a passkey challenge on it.
   *
   * @throws UnauthenticatedError when the provider knows no such login.
   * @throws IdpAdminUnavailableError when the provider cannot be reached or fails.
   */
  abstract startPasskeySignIn(loginName: string): Promise<PasskeySignInChallenge>;

  /**
   * Checks the device's `credential` against session `sessionId`'s challenge and resolves to the verified session.
   *
   * @throws UnauthenticatedError when the provider refuses the credential or the session is gone.
   * @throws IdpAdminUnavailableError when the provider cannot be reached or fails.
   */
  abstract finishPasskeySignIn(
    sessionId: string,
    credential: PasskeyCredential,
  ): Promise<IdpSessionGrant>;

  /**
   * Starts registering a passkey for the provider user `userId` and resolves to the options the device answers.
   *
   * @throws UnauthenticatedError when the provider knows no such user.
   * @throws IdpAdminUnavailableError when the provider cannot be reached or fails.
   */
  abstract startPasskeyRegistration(userId: string): Promise<PasskeyRegistrationChallenge>;

  /**
   * Checks the device's `credential` for the pending passkey `passkeyId` of `userId` and keeps it as `name`.
   *
   * @throws UnauthenticatedError when the provider refuses the credential.
   * @throws IdpAdminUnavailableError when the provider cannot be reached or fails.
   */
  abstract finishPasskeyRegistration(
    userId: string,
    passkeyId: string,
    credential: PasskeyCredential,
    name: string,
  ): Promise<void>;
}
