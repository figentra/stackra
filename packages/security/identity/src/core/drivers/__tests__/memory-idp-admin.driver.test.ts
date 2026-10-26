/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryIdpAdminDriver`: it is the `IdpAdmin` port; users and machine users are created with a
 *          taken login name refused per organisation; deactivation, removal and ending sessions; the device flow stays
 *          pending until approved or denied; login policies are kept per organisation; enrolled methods are listed once
 *          each and dropped with the user.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0410 (STA-834); STA-1264.
 */
import { describe, expect, it } from "@stackra/testing";

import { DeviceTokenStatus, IdpAdmin } from "#contracts/index";
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
});
