/**
 * Stackra file contract:
 * Purpose: `MemoryIdpAdminDriver`, an `IdpAdmin` held in memory, for tests and local runs: users, machine users,
 *          sessions, device flows, login policies (with their providers and second factors) and enrolled authentication methods live in maps a test can read back.
 * Boundary: process-local; never a real provider. Ids and secrets are random; a device flow stays pending until the
 *           test approves or denies it with `approveDevice` / `denyDevice`. `openSession` adds a session to end;
 *           `enrolAuthMethod` adds an `amr` code to a user.
 * Runtime: isomorphic
 * Governing contract: ADR 0263 (a driver is named by its class: `memory`); ADR 0266 (decision 2); ADR 0410 (STA-834); STA-1263.
 */
import { Driver } from "@stackra/container";

import { DeviceTokenStatus, IdpAdmin } from "#contracts/index";
import type {
  DeviceAuthorization,
  DeviceTokenResult,
  IdpMachineCredential,
  IdpMachineUserInput,
  IdpUserInput,
  LoginPolicy,
} from "#contracts/index";
import { IdpUserExistsError } from "#core/errors/idp-user-exists.error";
import { randomToken } from "#core/functions/random-token.function";

/** One user as the memory provider holds it. */
interface HeldUser {
  readonly organizationId: string;
  readonly username: string;
  readonly machine: boolean;
  active: boolean;
}

/**
 * A provider held in memory.
 *
 * @example
 * const idp = new MemoryIdpAdminDriver();
 * const userId = await idp.createUser({ organizationId: "org_1", username: "rana", givenName: "Rana", familyName: "Haddad", email: "rana@acme.example" });
 */
export class MemoryIdpAdminDriver extends Driver(IdpAdmin) {
  /** User id to user. */
  readonly users = new Map<string, HeldUser>();

  /** Session id to its user id. */
  readonly sessions = new Map<string, string>();

  /** Organisation id to its login policy. */
  readonly policies = new Map<string, LoginPolicy>();

  /** User id to the `amr` codes of its enrolled methods. */
  readonly authMethods = new Map<string, string[]>();

  /** Device code to its state. */
  private readonly devices = new Map<string, DeviceTokenStatus>();

  /** See `IdpAdmin.createUser`. */
  async createUser(input: IdpUserInput): Promise<string> {
    return this.add(input.organizationId, input.username, false);
  }

  /** See `IdpAdmin.createMachineUser`. */
  async createMachineUser(input: IdpMachineUserInput): Promise<IdpMachineCredential> {
    const userId = this.add(input.organizationId, input.username, true);
    return { userId, clientId: input.username, clientSecret: randomToken() };
  }

  /** See `IdpAdmin.deactivateUser`. */
  async deactivateUser(userId: string): Promise<void> {
    const user = this.users.get(userId);
    if (user !== undefined) user.active = false;
  }

  /** See `IdpAdmin.removeUser`. */
  async removeUser(userId: string): Promise<void> {
    this.users.delete(userId);
    this.authMethods.delete(userId);
    await this.endSessions(userId);
  }

  /** Opens a session for `userId`, resolving to its id, so a test has one to end. */
  openSession(userId: string): string {
    const sessionId = `ses_${randomToken()}`;
    this.sessions.set(sessionId, userId);
    return sessionId;
  }

  /** See `IdpAdmin.endSession`. */
  async endSession(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
  }

  /** See `IdpAdmin.endSessions`. */
  async endSessions(userId: string): Promise<number> {
    const ended = [...this.sessions].filter(([, owner]) => owner === userId);
    for (const [sessionId] of ended) this.sessions.delete(sessionId);
    return ended.length;
  }

  /** See `IdpAdmin.startDeviceAuthorization`. */
  async startDeviceAuthorization(): Promise<DeviceAuthorization> {
    const deviceCode = randomToken();
    this.devices.set(deviceCode, DeviceTokenStatus.Pending);
    return {
      deviceCode,
      userCode: deviceCode.slice(0, 8).toUpperCase(),
      verificationUri: "https://id.example/device",
      expiresIn: 600,
      interval: 5,
    };
  }

  /** Lets the device flow of `deviceCode` issue its token on the next poll. */
  approveDevice(deviceCode: string): void {
    this.devices.set(deviceCode, DeviceTokenStatus.Issued);
  }

  /** Makes the device flow of `deviceCode` answer `access_denied`. */
  denyDevice(deviceCode: string): void {
    this.devices.set(deviceCode, DeviceTokenStatus.Denied);
  }

  /** See `IdpAdmin.pollDeviceToken`; an unknown code answers `expired_token`. */
  async pollDeviceToken(_clientId: string, deviceCode: string): Promise<DeviceTokenResult> {
    const status = this.devices.get(deviceCode) ?? DeviceTokenStatus.Expired;
    if (status !== DeviceTokenStatus.Issued) return { status };
    this.devices.delete(deviceCode);
    return { status, accessToken: randomToken(), expiresIn: 3600 };
  }

  /** Enrols `userId` in the method `amr` (an RFC 8176 code), once. */
  enrolAuthMethod(userId: string, amr: string): void {
    const methods = this.authMethods.get(userId) ?? [];
    if (!methods.includes(amr)) this.authMethods.set(userId, [...methods, amr]);
  }

  /** See `IdpAdmin.listAuthMethods`; a user with none, or unknown, has none. */
  async listAuthMethods(userId: string): Promise<readonly string[]> {
    return [...(this.authMethods.get(userId) ?? [])];
  }

  /** See `IdpAdmin.setLoginPolicy`; a provider or factor list left out keeps the one set before. */
  async setLoginPolicy(organizationId: string, policy: LoginPolicy): Promise<void> {
    const before = this.policies.get(organizationId);
    const providers = policy.externalProviderIds ?? before?.externalProviderIds;
    const factors = policy.secondFactors ?? before?.secondFactors;
    this.policies.set(organizationId, {
      ...policy,
      ...(providers === undefined ? {} : { externalProviderIds: [...providers] }),
      ...(factors === undefined ? {} : { secondFactors: [...factors] }),
    });
  }

  /** Adds a user, refusing a login name already taken in the organisation. */
  private add(organizationId: string, username: string, machine: boolean): string {
    for (const user of this.users.values())
      if (user.organizationId === organizationId && user.username === username)
        throw IdpUserExistsError.create();
    const userId = `idp_${randomToken()}`;
    this.users.set(userId, { organizationId, username, machine, active: true });
    return userId;
  }
}
