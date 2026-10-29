/**
 * Stackra file contract:
 * Purpose: unit tests of `registerPasskey`: the creation options reach the device and its credential the confirm call
 *          under the given name; a device refusal comes back as a value and confirms nothing.
 * Boundary: test only; the memory passkeys and identity provider drivers stand in for the device and the BFF.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0206 (decision 8); STA-1538.
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { PasskeyRefusal } from "#contracts/index";
import type { PasskeyCredential } from "#contracts/index";
import { MemoryIdpAdminDriver } from "#core/drivers/memory-idp-admin.driver";
import { MemoryPasskeysDriver } from "#core/drivers/memory-passkeys.driver";
import { registerPasskey } from "#core/functions/register-passkey.function";

/** A provider with one user, and calls straight to the provider for that user. */
async function setup() {
  const idp = new MemoryIdpAdminDriver();
  const userId = await idp.createUser({
    organizationId: "org_1",
    username: "rana",
    givenName: "Rana",
    familyName: "Haddad",
    email: "rana@acme.example",
  });
  const confirm = vi.fn(
    (input: { passkeyId: string; name: string; credential: PasskeyCredential }) =>
      idp.finishPasskeyRegistration(userId, input.passkeyId, input.credential, input.name),
  );
  const calls = { register: () => idp.startPasskeyRegistration(userId), confirm };
  return { idp, userId, calls, confirm };
}

describe(registerPasskey, () => {
  it("confirms the device's new credential under the name", async () => {
    const { idp, userId, calls } = await setup();
    expect(await registerPasskey(new MemoryPasskeysDriver(), "iPhone", calls)).toEqual({
      ok: true,
    });
    expect([...idp.passkeys.values()]).toEqual([{ userId, name: "iPhone" }]);
  });

  it("returns the device's refusal and confirms nothing", async () => {
    const { calls, confirm } = await setup();
    const passkeys = new MemoryPasskeysDriver().refuseNext(PasskeyRefusal.Cancelled);
    expect(await registerPasskey(passkeys, "iPhone", calls)).toEqual({
      ok: false,
      error: PasskeyRefusal.Cancelled,
    });
    expect(confirm).not.toHaveBeenCalled();
  });
});
