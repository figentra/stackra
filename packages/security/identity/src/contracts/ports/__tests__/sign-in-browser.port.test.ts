/**
 * Stackra file contract:
 * Purpose: type and shape tests of the `SignInBrowser` port: an abstract port class that builds the platform's redirect
 *          URI and resolves the redirect, or `null` when the user closed the browser.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decisions 16 and 17); ADR 0277.
 */
import { Driver } from "@stackra/container";
import { Port } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { SignInBrowser } from "#contracts/ports/sign-in-browser.port";

/** A browser the user always closes. */
class ClosedBrowserDriver extends Driver(SignInBrowser) {
  redirectUri(path: string): string {
    return `acme://${path}`;
  }

  async authorize(): Promise<string | null> {
    return null;
  }
}

describe("SignInBrowser", () => {
  it("is a port, and its drivers are instances of it", async () => {
    const browser: SignInBrowser = new ClosedBrowserDriver();
    expect(browser).toBeInstanceOf(SignInBrowser);
    expect(browser).toBeInstanceOf(Port);
    expect(browser.redirectUri("auth/callback")).toBe("acme://auth/callback");
    expect(await browser.authorize("https://id.acme.example/authorize", "acme://x")).toBeNull();
  });

  it("types its members", () => {
    expectTypeOf<SignInBrowser["redirectUri"]>().parameters.toEqualTypeOf<[string]>();
    expectTypeOf<SignInBrowser["authorize"]>().returns.toEqualTypeOf<Promise<string | null>>();
  });
});
