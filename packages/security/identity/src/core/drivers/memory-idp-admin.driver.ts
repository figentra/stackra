/**
 * Stackra file contract:
 * Purpose: `MemoryIdpAdminDriver`, an `IdpAdmin` held in memory, for tests and local runs: users, machine users,
 *          sessions, device flows, login policies (with their providers and second factors), enrolled authentication
 *          methods and passkeys live in maps a test can read back.
 * Boundary: process-local; never a real provider. Ids and secrets are random; a device flow stays pending until the
 *           test approves or denies it with `approveDevice` / `denyDevice`. `openSession` adds a session to list and end;
 *           `enrolAuthMethod` adds an `amr` code to a user. A user created with a `stackraUserId` is found by it. A
 *           passkey sign-in needs a known login name; any credential passes its check (no signature is verified), and
 *           a finished registration adds the `swk` method.
 * Runtime: isomorphic
 * Governing contract: ADR 0263 (a driver is named by its class: `memory`); ADR 0266 (decision 2); ADR 0410 (STA-834); STA-1263; STA-1538; STA-1543; STA-1580.
 */
import { Driver } from "@stackra/container";
import { UnauthenticatedError } from "@stackra/errors";

import { DeviceTokenStatus, IdpAdmin } from "#contracts/index";
import type {
  DeviceAuthorization,
  DeviceTokenResult,
  IdpMachineCredential,
  IdpMachineUserInput,
  IdpSession,
  IdpSessionGrant,
  IdpUserInput,
  LoginPolicy,
  PasskeyCredential,
  PasskeyRegistrationChallenge,
  PasskeySignInChallenge,
} from "#contracts/index";
import { IdpUserExistsError } from "#core/errors/idp-user-exists.error";
import { randomToken } from "#core/functions/random-token.function";

/** One user as the memory provider holds it. */
interface HeldUser {
  readonly organizationId: string;
  readonly username: string;
  readonly machine: boolean;
  readonly stackraUserId?: string;
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

  /** Session id to its user id and what `listSessions` answers for it. */
  readonly sessions = new Map<string, { readonly userId: string; readonly session: IdpSession }>();

  /** Organisation id to its login policy. */
  readonly policies = new Map<string, LoginPolicy>();

  /** User id to the `amr` codes of its enrolled methods. */
  readonly authMethods = new Map<string, string[]>();

  /** Passkey id to its user id and, once registered, its name. */
  readonly passkeys = new Map<string, { readonly userId: string; name?: string }>();

  /** Device code to its state. */
  private readonly devices = new Map<string, DeviceTokenStatus>();

  /** Implements `IdpAdmin.createUser`, documented there. */
  async createUser(input: IdpUserInput): Promise<string> {
    return this.add(input.organizationId, input.username, false, input.stackraUserId);
  }

  /** Implements `IdpAdmin.createMachineUser`, documented there. */
  async createMachineUser(input: IdpMachineUserInput): Promise<IdpMachineCredential> {
    const userId = this.add(input.organizationId, input.username, true);
    return { userId, clientId: input.username, clientSecret: randomToken() };
  }

  /** Implements `IdpAdmin.deactivateUser`, documented there. */
  async deactivateUser(userId: string): Promise<void> {
    const user = this.users.get(userId);
    if (user !== undefined) user.active = false;
  }

  /** Implements `IdpAdmin.removeUser`, documented there. */
  async removeUser(userId: string): Promise<void> {
    this.users.delete(userId);
    this.authMethods.delete(userId);
    await this.endSessions(userId);
  }

  /** Opens a session for `userId` from the device `userAgent`, resolving to its id, so a test has one to list and end. */
  openSession(userId: string, userAgent?: string): string {
    const sessionId = `ses_${randomToken()}`;
    const at = new Date().toISOString();
    this.sessions.set(sessionId, {
      userId,
      session: {
        sessionId,
        createdAt: at,
        lastActiveAt: at,
        ...(userAgent === undefined ? {} : { userAgent }),
      },
    });
    return sessionId;
  }

  /** Implements `IdpAdmin.listSessions`, documented there. */
  async listSessions(userId: string): Promise<readonly IdpSession[]> {
    return [...this.sessions.values()]
      .filter((held) => held.userId === userId)
      .map((held) => held.session);
  }

  /** Implements `IdpAdmin.endSession`, documented there. */
  async endSession(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
  }

  /** Implements `IdpAdmin.endSessions`, documented there. */
  async endSessions(userId: string): Promise<number> {
    const ended = [...this.sessions].filter(([, held]) => held.userId === userId);
    for (const [sessionId] of ended) this.sessions.delete(sessionId);
    return ended.length;
  }

  /** Implements `IdpAdmin.startDeviceAuthorization`, documented there. */
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

  /** See `IdpAdmin.findUserId`; a user created without a Stackra id is never found. */
  async findUserId(stackraUserId: string): Promise<string | undefined> {
    for (const [userId, user] of this.users)
      if (user.stackraUserId === stackraUserId) return userId;
    return undefined;
  }

  /** See `IdpAdmin.startPasskeySignIn`; opens the session at once, as the memory provider checks nothing. */
  async startPasskeySignIn(loginName: string): Promise<PasskeySignInChallenge> {
    const userId = [...this.users].find(([, user]) => user.username === loginName)?.[0];
    if (userId === undefined) throw UnauthenticatedError.create();
    return {
      sessionId: this.openSession(userId),
      options: { challenge: randomToken(), rpId: "id.example", userVerification: "required" },
    };
  }

  /** See `IdpAdmin.finishPasskeySignIn`; an unknown session is refused, and the credential is not checked. */
  async finishPasskeySignIn(
    sessionId: string,
    _credential: PasskeyCredential,
  ): Promise<IdpSessionGrant> {
    if (!this.sessions.has(sessionId)) throw UnauthenticatedError.create();
    return { sessionId, sessionToken: randomToken() };
  }

  /** See `IdpAdmin.startPasskeyRegistration`; an unknown user is refused, as ZITADEL's 404 is. */
  async startPasskeyRegistration(userId: string): Promise<PasskeyRegistrationChallenge> {
    const user = this.users.get(userId);
    if (user === undefined) throw UnauthenticatedError.create();
    const passkeyId = `pk_${randomToken()}`;
    this.passkeys.set(passkeyId, { userId });
    return {
      passkeyId,
      options: {
        challenge: randomToken(),
        rp: { id: "id.example", name: "Example" },
        user: { id: userId, name: user.username, displayName: user.username },
        pubKeyCredParams: [{ type: "public-key", alg: -7 }],
      },
    };
  }

  /** See `IdpAdmin.finishPasskeyRegistration`; a passkey not pending for `userId` is refused. */
  async finishPasskeyRegistration(
    userId: string,
    passkeyId: string,
    _credential: PasskeyCredential,
    name: string,
  ): Promise<void> {
    const passkey = this.passkeys.get(passkeyId);
    if (passkey?.userId !== userId || passkey.name !== undefined)
      throw UnauthenticatedError.create();
    passkey.name = name;
    this.enrolAuthMethod(userId, "swk");
  }

  /** Adds a user, refusing a login name already taken in the organisation. */
  private add(
    organizationId: string,
    username: string,
    machine: boolean,
    stackraUserId?: string,
  ): string {
    for (const user of this.users.values())
      if (user.organizationId === organizationId && user.username === username)
        throw IdpUserExistsError.create();
    const userId = `idp_${randomToken()}`;
    this.users.set(userId, {
      organizationId,
      username,
      machine,
      ...(stackraUserId === undefined ? {} : { stackraUserId }),
      active: true,
    });
    return userId;
  }
}
