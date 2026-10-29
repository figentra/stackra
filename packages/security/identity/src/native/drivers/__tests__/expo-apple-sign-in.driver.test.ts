/**
 * Stackra file contract:
 * Purpose: unit tests of `ExpoAppleSignInDriver`: it is an `AppleSignIn`; a credential comes back with the name
 *          joined; an unavailable device, a missing token, a cancel and another library code are refusals; a
 *          non-library error rethrows; without the library every call throws an error naming it.
 * Boundary: test only; the library is a stand-in handed through the driver's `library()` seam.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0206 (decision 8); STA-1578.
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { AppleSignIn, AppleSignInRefusal } from "#contracts/index";
import { ExpoAppleSignInDriver } from "#native/drivers/expo-apple-sign-in.driver";
import type { AppleAuthenticationModule } from "#native/types/apple-authentication-module.type";

const library = {
  isAvailableAsync: vi.fn(async () => true),
  signInAsync: vi.fn(),
  AppleAuthenticationScope: { FULL_NAME: 0, EMAIL: 1 },
};

/** The driver over the stand-in library. */
class StandInDriver extends ExpoAppleSignInDriver {
  protected override library(): AppleAuthenticationModule {
    return library;
  }
}

const CREDENTIAL = {
  user: "001.apple",
  identityToken: "a.b.c",
  authorizationCode: "code",
  email: "ada@privaterelay.appleid.com",
  fullName: { givenName: "Ada", familyName: "Lovelace" },
};

describe("ExpoAppleSignInDriver", () => {
  it("is an AppleSignIn and hands back the credential with the name joined", async () => {
    const apple = new StandInDriver();
    expect(apple).toBeInstanceOf(AppleSignIn);
    library.signInAsync.mockResolvedValueOnce(CREDENTIAL);

    expect(await apple.signIn("n1")).toEqual({
      ok: true,
      data: {
        identityToken: "a.b.c",
        authorizationCode: "code",
        user: "001.apple",
        email: "ada@privaterelay.appleid.com",
        name: "Ada Lovelace",
      },
    });
    expect(library.signInAsync).toHaveBeenCalledWith({ requestedScopes: [0, 1], nonce: "n1" });
  });

  it("refuses an unavailable device, a missing token, a cancel and another code", async () => {
    const apple = new StandInDriver();
    library.isAvailableAsync.mockResolvedValueOnce(false);
    expect(await apple.signIn("n")).toEqual({ ok: false, error: AppleSignInRefusal.Unsupported });

    library.signInAsync.mockResolvedValueOnce({ ...CREDENTIAL, identityToken: null });
    expect(await apple.signIn("n")).toEqual({ ok: false, error: AppleSignInRefusal.Failed });

    library.signInAsync.mockRejectedValueOnce({ code: "ERR_REQUEST_CANCELED" });
    expect(await apple.signIn("n")).toEqual({ ok: false, error: AppleSignInRefusal.Cancelled });

    library.signInAsync.mockRejectedValueOnce({ code: "ERR_REQUEST_FAILED" });
    expect(await apple.signIn("n")).toEqual({ ok: false, error: AppleSignInRefusal.Failed });
  });

  it("rethrows an error that is not the library's", async () => {
    library.signInAsync.mockRejectedValueOnce(new TypeError("bug"));
    await expect(new StandInDriver().signIn("n")).rejects.toThrow("bug");
  });

  it("names the library when the app has not installed it", async () => {
    await expect(new ExpoAppleSignInDriver().isAvailable()).rejects.toThrow(
      "Sign in with Apple needs expo-apple-authentication",
    );
  });
});
