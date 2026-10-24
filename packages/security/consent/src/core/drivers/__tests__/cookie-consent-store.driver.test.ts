// @vitest-environment jsdom
/**
 * Stackra file contract:
 * Purpose: unit tests of `CookieConsentStoreDriver`: it writes the decision as the one named cookie and reads it back,
 *          sets the fixed attributes (path, lifetime, SameSite, Secure only on HTTPS), clears it, reads an absent,
 *          edited or foreign cookie as no decision, answers `null` outside a browser and refuses to write there.
 * Boundary: test only; jsdom supplies `document.cookie`, and the attribute test records the raw assignment.
 * Runtime: browser (vitest, jsdom)
 * Governing contract: ADR 0022; ADR 0298 (decisions 3 and 6).
 */
import { buildConfig } from "@stackra/config";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { ConsentConfig } from "#config/consent.config";
import { ConsentStore } from "#contracts/ports/consent-store.port";
import { CookieConsentStoreDriver } from "#core/drivers/cookie-consent-store.driver";

/** A stored decision. */
const RECORD = {
  policyVersion: "1",
  decidedAt: "2026-10-24T09:00:00.000Z",
  categories: { analytics: true },
};

/** A driver over the default configuration (cookie `consent`, 180 days). */
const driver = () => new CookieConsentStoreDriver(buildConfig(ConsentConfig));

describe("CookieConsentStoreDriver", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    document.cookie = "consent=; Path=/; Max-Age=0";
    document.cookie = "other=; Path=/; Max-Age=0";
  });

  it("is a ConsentStore", () => {
    expect(driver()).toBeInstanceOf(ConsentStore);
  });

  it("writes the decision as the consent cookie and reads it back", () => {
    driver().write(RECORD);
    expect(document.cookie).toContain(`consent=${encodeURIComponent(JSON.stringify(RECORD))}`);
    expect(driver().read()).toEqual(RECORD);
  });

  it("finds its cookie among others", () => {
    document.cookie = "other=1; Path=/";
    driver().write(RECORD);
    expect(driver().read()).toEqual(RECORD);
  });

  it("uses the configured cookie name", () => {
    const named = new CookieConsentStoreDriver(
      buildConfig(ConsentConfig, { values: { cookieName: "site_consent" } }),
    );
    named.write(RECORD);
    expect(document.cookie).toContain("site_consent=");
    expect(driver().read()).toBeNull();
    named.clear();
  });

  it("sets the path, the lifetime and SameSite, and Secure only on HTTPS", () => {
    const writes: string[] = [];
    vi.spyOn(document, "cookie", "set").mockImplementation((value: string) => {
      writes.push(value);
    });
    driver().write(RECORD);
    expect(writes[0]).toMatch(/; Path=\/; Max-Age=15552000; SameSite=Lax$/);
    vi.stubGlobal("location", { protocol: "https:" });
    driver().write(RECORD);
    expect(writes[1]).toMatch(/; SameSite=Lax; Secure$/);
  });

  it("clears the cookie", () => {
    driver().write(RECORD);
    driver().clear();
    expect(driver().read()).toBeNull();
  });

  it.each([
    ["no cookie", null],
    ["an edited cookie", "consent=%7Bnot-json"],
    ["a cookie of another shape", `consent=${encodeURIComponent('{"granted":true}')}`],
    ["a malformed escape", "consent=%E0%A4%A"],
  ])("reads %s as no decision", (_case, cookie) => {
    if (cookie !== null) document.cookie = `${cookie}; Path=/`;
    expect(driver().read()).toBeNull();
  });

  it("answers null outside a browser and refuses to write there", () => {
    vi.stubGlobal("document", undefined);
    expect(driver().read()).toBeNull();
    expect(() => driver().write(RECORD)).toThrow(/browser/);
    expect(() => driver().clear()).toThrow(/browser/);
  });
});
