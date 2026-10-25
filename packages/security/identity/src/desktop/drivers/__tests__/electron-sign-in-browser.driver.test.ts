/**
 * Stackra file contract:
 * Purpose: unit tests of `ElectronSignInBrowserDriver`: it is a `SignInBrowser` with a loopback redirect in the dynamic
 *          range; it opens the hosted sign-in in the system browser and hands back the URL the browser was redirected
 *          to; a request to another path is refused and keeps waiting.
 * Boundary: test only; `electron`'s `shell.openExternal` is replaced by a stand-in that plays the browser with `fetch`
 *           against the real loopback listener.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0277; RFC 8252.
 */
import { buildConfig } from "@stackra/config";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { IdentityConfig } from "#config/identity.config";
import { SignInBrowser } from "#contracts/index";
import { ElectronSignInBrowserDriver } from "#desktop/drivers/electron-sign-in-browser.driver";

/** The redirect the stand-in browser follows. */
const browser = vi.hoisted(() => ({ redirect: "" }));

vi.mock("electron", () => ({
  shell: {
    openExternal: vi.fn(async () => {
      const stray = await fetch(browser.redirect.replace("/auth/callback", "/favicon.ico"));
      if (stray.status !== 404) throw new Error("a stray path was accepted");
      await fetch(browser.redirect);
    }),
  },
}));

describe("ElectronSignInBrowserDriver", () => {
  it("redirects to the loopback in the dynamic range", () => {
    const driver = new ElectronSignInBrowserDriver(buildConfig(IdentityConfig));
    expect(driver).toBeInstanceOf(SignInBrowser);
    expect(driver.port).toBeGreaterThanOrEqual(49_152);
    expect(driver.port).toBeLessThanOrEqual(65_535);
    expect(driver.redirectUri("auth/callback")).toBe(
      `http://127.0.0.1:${driver.port}/auth/callback`,
    );
  });

  it("hands back the URL the browser was redirected to", async () => {
    const driver = new ElectronSignInBrowserDriver(buildConfig(IdentityConfig));
    const redirectUri = driver.redirectUri("auth/callback");
    browser.redirect = `${redirectUri}?code=c1&state=s1`;
    expect(await driver.authorize("https://id.acme.example/authorize", redirectUri)).toBe(
      `${redirectUri}?code=c1&state=s1`,
    );
  });
});
