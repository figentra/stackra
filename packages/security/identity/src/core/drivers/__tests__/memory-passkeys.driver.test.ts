/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryPasskeysDriver`: it is a `Passkeys`; a registered credential answers a sign-in for its
 *          relying party; an excluded one refuses a second registration; an unknown site, a switched-off device and
 *          `refuseNext` refuse.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0206 (decision 8); STA-1538.
 */
import { describe, expect, it } from "@stackra/testing";

import { PasskeyRefusal, Passkeys } from "#contracts/index";
import type { PasskeyCreationOptions } from "#contracts/index";
import { MemoryPasskeysDriver } from "#core/drivers/memory-passkeys.driver";

const creation: PasskeyCreationOptions = {
  challenge: "c1",
  rp: { id: "id.acme.example", name: "Acme" },
  user: { id: "dTE", name: "ada@acme.example", displayName: "Ada" },
  pubKeyCredParams: [{ type: "public-key", alg: -7 }],
};

describe("MemoryPasskeysDriver", () => {
  it("is a Passkeys that signs in with the passkey it registered", async () => {
    const passkeys = new MemoryPasskeysDriver();
    expect(passkeys).toBeInstanceOf(Passkeys);
    expect(passkeys.isSupported()).toBe(true);

    const registered = await passkeys.register(creation);
    expect(registered).toMatchObject({
      ok: true,
      data: { id: "memory-passkey-1", type: "public-key" },
    });

    expect(await passkeys.authenticate({ challenge: "c2", rpId: "id.acme.example" })).toMatchObject(
      {
        ok: true,
        data: { id: "memory-passkey-1", response: { clientDataJSON: "c2" } },
      },
    );
  });

  it("refuses a second registration, an unknown site and a disallowed credential", async () => {
    const passkeys = new MemoryPasskeysDriver();
    await passkeys.register(creation);
    expect(
      await passkeys.register({
        ...creation,
        excludeCredentials: [{ id: "memory-passkey-1", type: "public-key" }],
      }),
    ).toEqual({ ok: false, error: PasskeyRefusal.AlreadyRegistered });
    expect(await passkeys.authenticate({ challenge: "c", rpId: "other.example" })).toEqual({
      ok: false,
      error: PasskeyRefusal.NoCredential,
    });
    expect(
      await passkeys.authenticate({
        challenge: "c",
        rpId: "id.acme.example",
        allowCredentials: [{ id: "someone-else", type: "public-key" }],
      }),
    ).toEqual({ ok: false, error: PasskeyRefusal.NoCredential });
  });

  it("refuses once after refuseNext, and always when switched off", async () => {
    const passkeys = new MemoryPasskeysDriver().refuseNext(PasskeyRefusal.Cancelled);
    expect(await passkeys.register(creation)).toEqual({
      ok: false,
      error: PasskeyRefusal.Cancelled,
    });
    expect((await passkeys.register(creation)).ok).toBe(true);

    passkeys.supported = false;
    expect(passkeys.isSupported()).toBe(false);
    expect(await passkeys.authenticate({ challenge: "c", rpId: "id.acme.example" })).toEqual({
      ok: false,
      error: PasskeyRefusal.Unsupported,
    });
  });
});
