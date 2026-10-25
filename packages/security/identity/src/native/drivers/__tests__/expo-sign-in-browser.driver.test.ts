/**
 * Stackra file contract:
 * Purpose: unit tests of `ExpoSignInBrowserDriver`: it is a `SignInBrowser`; the redirect URI is the app link of the
 *          path; a successful session hands back the redirected URL; a closed or dismissed one answers `null`.
 * Boundary: test only; `expo-linking` and `expo-web-browser` are replaced by stand-ins.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0206 (decision 8).
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { SignInBrowser } from "#contracts/index";
import { ExpoSignInBrowserDriver } from "#native/drivers/expo-sign-in-browser.driver";

const session = vi.hoisted(() => ({
  result: { type: "cancel" } as { type: string; url?: string },
}));

vi.mock("expo-linking", () => ({ createURL: (path: string) => `acme://${path}` }));
vi.mock("expo-web-browser", () => ({
  openAuthSessionAsync: vi.fn(async () => session.result),
}));

describe("ExpoSignInBrowserDriver", () => {
  it("is a SignInBrowser with the app link as redirect", () => {
    const browser = new ExpoSignInBrowserDriver();
    expect(browser).toBeInstanceOf(SignInBrowser);
    expect(browser.redirectUri("auth/callback")).toBe("acme://auth/callback");
  });

  it("hands back the redirected URL, or null when the session was closed", async () => {
    const browser = new ExpoSignInBrowserDriver();
    session.result = { type: "success", url: "acme://auth/callback?code=c1&state=s1" };
    expect(
      await browser.authorize("https://id.acme.example/authorize", "acme://auth/callback"),
    ).toBe("acme://auth/callback?code=c1&state=s1");
    for (const type of ["cancel", "dismiss"]) {
      session.result = { type };
      expect(await browser.authorize("https://id.acme.example/authorize", "acme://x")).toBeNull();
    }
  });
});
