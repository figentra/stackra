/**
 * Stackra file contract:
 * Purpose: unit tests of `signInWithPasskey`: the challenge reaches the device and its credential the verify call; a
 *          device refusal comes back as a value and verifies nothing.
 * Boundary: test only; the memory passkeys and identity provider drivers stand in for the device and the BFF.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0206 (decision 8); STA-1538.
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { type PasskeyCredential, PasskeyRefusal } from "#contracts/index";
import { MemoryIdpAdminDriver } from "#core/drivers/memory-idp-admin.driver";
import { MemoryPasskeysDriver } from "#core/drivers/memory-passkeys.driver";
import { signInWithPasskey } from "#core/functions/sign-in-with-passkey.function";

/** A provider with one user holding a passkey on the device, and calls straight to the provider. */
async function setup() {
  const idp = new MemoryIdpAdminDriver();
  const passkeys = new MemoryPasskeysDriver();
  const userId = await idp.createUser({
    organizationId: "org_1",
    username: "rana",
    givenName: "Rana",
    familyName: "Haddad",
    email: "rana@acme.example",
  });
  const { options } = await idp.startPasskeyRegistration(userId);
  await passkeys.register(options);
  const verify = vi.fn((input: { sessionId: string; credential: PasskeyCredential }) =>
    idp.finishPasskeySignIn(input.sessionId, input.credential),
  );
  const calls = {
    challenge: (input: { loginName: string }) => idp.startPasskeySignIn(input.loginName),
    verify,
  };
  return { passkeys, calls, verify };
}

describe(signInWithPasskey, () => {
  it("sends the device's credential for the challenge's session to verify", async () => {
    const { passkeys, calls, verify } = await setup();
    const result = await signInWithPasskey(passkeys, "rana", calls);
    expect(result.ok).toBe(true);
    const [input] = verify.mock.calls[0] ?? [];
    expect(result.ok && result.data.sessionId).toBe(input?.sessionId);
    expect(input?.credential).toMatchObject({ type: "public-key" });
  });

  it("returns the device's refusal and verifies nothing", async () => {
    const { passkeys, calls, verify } = await setup();
    passkeys.refuseNext(PasskeyRefusal.Cancelled);
    expect(await signInWithPasskey(passkeys, "rana", calls)).toEqual({
      ok: false,
      error: PasskeyRefusal.Cancelled,
    });
    expect(verify).not.toHaveBeenCalled();
  });
});
