/**
 * Stackra file contract:
 * Purpose: the `IdpAdmin` port: run-time administration of the identity provider: create human and machine users,
 *          deactivate and remove a user, end one session or every session of a user, run the OAuth device flow, and set
 *          an organisation's login policy; read which authentication methods a user has enrolled (as RFC 8176 `amr`
 *          codes, so `assuranceOf` turns them into the MFA level the security page's enrolment list needs).
 * Boundary: an abstract class that is its own token. The ZITADEL driver calls the provider's APIs with the service
 *           account token `IdpAdminConfig` reads from the secret store (managed ZITADEL or the tenant's own instance,
 *           by `IdpAdminConfig.url`); the memory driver serves tests. Server only in use: it holds an admin credential.
 *           Which users, policies and sessions to touch is the identity service's actions and settings, never this
 *           port. Ending a session that is already gone is not an error.
 * Runtime: isomorphic
 * Governing contract: ADR 0206; ADR 0207; ADR 0235 (decision 1); RFC 8628; ADR 0410 (STA-834); RFC 8176; STA-1264 (MFA enrolment).
 */
import { Port } from "@stackra/contracts";

import type { DeviceAuthorization } from "#contracts/types/device-authorization.type";
import type { DeviceTokenResult } from "#contracts/types/device-token-result.type";
import type { IdpMachineCredential } from "#contracts/types/idp-machine-credential.type";
import type { IdpMachineUserInput } from "#contracts/types/idp-machine-user-input.type";
import type { IdpUserInput } from "#contracts/types/idp-user-input.type";
import type { LoginPolicy } from "#contracts/types/login-policy.type";

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
}
