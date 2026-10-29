/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryIdpAdminDriver`: it is the `IdpAdmin` port; users and machine users are created with a
 *          taken login name refused per organisation; deactivation, removal, listing a user's own sessions and ending them; the device flow stays
 *          pending until approved or denied; login policies are kept per organisation, a left-out provider or factor list keeping the last; enrolled methods are listed once
 *          each and dropped with the user; a user is found by its Stackra id; a passkey sign-in needs a known login and
 *          a live session; a passkey registration finishes once and enrols `swk`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0410 (STA-834); STA-1264; STA-1538; STA-1543; STA-1580.
 */
import { UnauthenticatedError } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { DeviceTokenStatus, IdpAdmin, IdpSecondFactor } from "#contracts/index";
import type { LoginPolicy } from "#contracts/index";
import { MemoryIdpAdminDriver } from "#core/drivers/memory-idp-admin.driver";
import { IdpUserExistsError } from "#core/errors/idp-user-exists.error";

const RANA = {
  organizationId: "org_1",
  username: "rana",
  givenName: "Rana",
  familyName: "Haddad",
  email: "rana@acme.example",
};

const POLICY: LoginPolicy = {
  allowUsernamePassword: true,
  allowRegister: false,
  allowExternalIdp: true,
  forceMfa: true,
  allowPasswordless: true,
  hidePasswordReset: false,
  ignoreUnknownUsernames: true,
};

describe(MemoryIdpAdminDriver, () => {
  it("creates users and machine users, refusing a taken name in the same organisation", async () => {
    const idp = new MemoryIdpAdminDriver();
    expect(idp).toBeInstanceOf(IdpAdmin);
    const userId = await idp.createUser(RANA);
    expect(idp.users.get(userId)).toMatchObject({ username: "rana", machine: false, active: true });
    await expect(idp.createUser(RANA)).rejects.toBeInstanceOf(IdpUserExistsError);
    expect(await idp.createUser({ ...RANA, organizationId: "org_2" })).not.toBe(userId);
    const machine = await idp.createMachineUser({
      organizationId: "org_1",
      username: "till_7",
      name: "Till 7",
    });
    expect(machine.clientSecret.length).toBeGreaterThan(20);
    expect(idp.users.get(machine.userId)?.machine).toBe(true);
  });

  it("deactivates, removes and ends sessions", async () => {
    const idp = new MemoryIdpAdminDriver();
    const userId = await idp.createUser(RANA);
    const first = idp.openSession(userId);
    idp.openSession(userId);
    await idp.endSession(first);
    await idp.endSession("ses_gone");
    expect(await idp.endSessions(userId)).toBe(1);
    await idp.deactivateUser(userId);
    expect(idp.users.get(userId)?.active).toBe(false);
    idp.openSession(userId);
    await idp.removeUser(userId);
    expect(idp.users.has(userId)).toBe(false);
    expect(idp.sessions.size).toBe(0);
  });

  it("lists only the user's own sessions with the device's description", async () => {
    const idp = new MemoryIdpAdminDriver();
    const userId = await idp.createUser(RANA);
    const mine = idp.openSession(userId, "Safari on iOS");
    idp.openSession("idp_other");
    const sessions = await idp.listSessions(userId);
    expect(sessions).toEqual([
      expect.objectContaining({ sessionId: mine, userAgent: "Safari on iOS" }),
    ]);
    expect(sessions[0]?.lastActiveAt).toBe(sessions[0]?.createdAt);
    expect(await idp.listSessions("idp_unknown")).toEqual([]);
  });

  it("runs the device flow and keeps login policies per organisation", async () => {
    const idp = new MemoryIdpAdminDriver();
    const started = await idp.startDeviceAuthorization();
    expect((await idp.pollDeviceToken("till", started.deviceCode)).status).toBe(
      DeviceTokenStatus.Pending,
    );
    idp.approveDevice(started.deviceCode);
    const issued = await idp.pollDeviceToken("till", started.deviceCode);
    expect(issued.status).toBe(DeviceTokenStatus.Issued);
    expect(issued.accessToken).toBeDefined();
    const denied = await idp.startDeviceAuthorization();
    idp.denyDevice(denied.deviceCode);
    expect((await idp.pollDeviceToken("till", denied.deviceCode)).status).toBe(
      DeviceTokenStatus.Denied,
    );
    await idp.setLoginPolicy("org_1", POLICY);
    expect(idp.policies.get("org_1")).toEqual(POLICY);
  });

  it("lists enrolled authentication methods once each and drops them with the user", async () => {
    const idp = new MemoryIdpAdminDriver();
    const userId = await idp.createUser(RANA);
    expect(await idp.listAuthMethods(userId)).toEqual([]);
    idp.enrolAuthMethod(userId, "pwd");
    idp.enrolAuthMethod(userId, "otp");
    idp.enrolAuthMethod(userId, "otp");
    expect(await idp.listAuthMethods(userId)).toEqual(["pwd", "otp"]);
    await idp.removeUser(userId);
    expect(await idp.listAuthMethods(userId)).toEqual([]);
  });

  it("keeps the providers and second factors a later policy leaves out", async () => {
    const idp = new MemoryIdpAdminDriver();
    await idp.setLoginPolicy("org_1", {
      ...POLICY,
      externalProviderIds: ["idp_nafath"],
      secondFactors: [IdpSecondFactor.Totp],
    });
    await idp.setLoginPolicy("org_1", { ...POLICY, forceMfa: true });
    expect(idp.policies.get("org_1")).toEqual({
      ...POLICY,
      forceMfa: true,
      externalProviderIds: ["idp_nafath"],
      secondFactors: [IdpSecondFactor.Totp],
    });
    await idp.setLoginPolicy("org_1", { ...POLICY, externalProviderIds: [] });
    expect(idp.policies.get("org_1")?.externalProviderIds).toEqual([]);
  });

  it("finds a user by its Stackra id", async () => {
    const idp = new MemoryIdpAdminDriver();
    const userId = await idp.createUser({ ...RANA, stackraUserId: "usr_1" });
    expect(await idp.findUserId("usr_1")).toBe(userId);
    expect(await idp.findUserId("usr_2")).toBeUndefined();
  });

  it("signs in with a passkey on a known login and a live session only", async () => {
    const idp = new MemoryIdpAdminDriver();
    await idp.createUser(RANA);
    await expect(idp.startPasskeySignIn("nobody")).rejects.toBeInstanceOf(UnauthenticatedError);
    const { sessionId } = await idp.startPasskeySignIn("rana");
    const credential = { id: "c", rawId: "c", type: "public-key", response: {} } as const;
    expect((await idp.finishPasskeySignIn(sessionId, credential)).sessionId).toBe(sessionId);
    await idp.endSession(sessionId);
    await expect(idp.finishPasskeySignIn(sessionId, credential)).rejects.toBeInstanceOf(
      UnauthenticatedError,
    );
  });

  it("registers a passkey once and enrols the swk method", async () => {
    const idp = new MemoryIdpAdminDriver();
    const userId = await idp.createUser(RANA);
    const { passkeyId } = await idp.startPasskeyRegistration(userId);
    const credential = { id: "c", rawId: "c", type: "public-key", response: {} } as const;
    await idp.finishPasskeyRegistration(userId, passkeyId, credential, "iPhone");
    expect(idp.passkeys.get(passkeyId)).toEqual({ userId, name: "iPhone" });
    expect(await idp.listAuthMethods(userId)).toEqual(["swk"]);
    await expect(
      idp.finishPasskeyRegistration(userId, passkeyId, credential, "again"),
    ).rejects.toBeInstanceOf(UnauthenticatedError);
  });

  it("refuses a passkey registration for an unknown user", async () => {
    await expect(
      new MemoryIdpAdminDriver().startPasskeyRegistration("idp_9"),
    ).rejects.toBeInstanceOf(UnauthenticatedError);
  });
});
