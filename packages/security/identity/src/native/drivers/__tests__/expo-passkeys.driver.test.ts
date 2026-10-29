/**
 * Stackra file contract:
 * Purpose: unit tests of `ExpoPasskeysDriver`: it is a `Passkeys`; support comes from the library; a credential comes
 *          back as WebAuthn JSON with `rawId` filled; the library's error codes map to refusals; a non-library error
 *          rethrows.
 * Boundary: test only; `react-native-passkey` is replaced by a stand-in.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0206 (decision 8); STA-1538.
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { PasskeyRefusal, Passkeys } from "#contracts/index";
import { ExpoPasskeysDriver } from "#native/drivers/expo-passkeys.driver";

const library = vi.hoisted(() => ({
  isSupported: vi.fn(() => true),
  create: vi.fn(),
  get: vi.fn(),
}));

vi.mock("react-native-passkey", () => ({ Passkey: library }));

const request = { challenge: "c1", rpId: "id.acme.example" };

describe("ExpoPasskeysDriver", () => {
  it("is a Passkeys whose support comes from the library", () => {
    const passkeys = new ExpoPasskeysDriver();
    expect(passkeys).toBeInstanceOf(Passkeys);
    expect(passkeys.isSupported()).toBe(true);
  });

  it("hands back the credential with rawId filled", async () => {
    library.get.mockResolvedValueOnce({
      id: "k1",
      response: { clientDataJSON: "x", authenticatorData: "a", signature: "s" },
    });
    expect(await new ExpoPasskeysDriver().authenticate(request)).toEqual({
      ok: true,
      data: {
        id: "k1",
        rawId: "k1",
        type: "public-key",
        response: { clientDataJSON: "x", authenticatorData: "a", signature: "s" },
      },
    });
    expect(library.get).toHaveBeenCalledWith(request);
  });

  it("maps the library's error codes to refusals", async () => {
    const cases: [string, PasskeyRefusal][] = [
      ["UserCancelled", PasskeyRefusal.Cancelled],
      ["NoCredentials", PasskeyRefusal.NoCredential],
      ["BadConfiguration", PasskeyRefusal.Unsupported],
      ["CredentialAlreadyExists", PasskeyRefusal.AlreadyRegistered],
      ["TimedOut", PasskeyRefusal.Failed],
    ];
    for (const [code, refusal] of cases) {
      library.create.mockRejectedValueOnce({ error: code, message: code });
      expect(
        await new ExpoPasskeysDriver().register({
          challenge: "c",
          rp: { id: "id.acme.example", name: "Acme" },
          user: { id: "dTE", name: "ada", displayName: "Ada" },
          pubKeyCredParams: [{ type: "public-key", alg: -7 }],
        }),
      ).toEqual({ ok: false, error: refusal });
    }
  });

  it("rethrows an error that is not the library's", async () => {
    library.get.mockRejectedValueOnce(new TypeError("bug"));
    await expect(new ExpoPasskeysDriver().authenticate(request)).rejects.toThrow("bug");
  });
});
