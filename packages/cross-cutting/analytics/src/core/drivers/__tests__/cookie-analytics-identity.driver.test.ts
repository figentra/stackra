/**
 * Stackra file contract:
 * Purpose: unit tests of `CookieAnalyticsIdentityDriver`: it keeps the identity in the `identityCookieName` cookie with
 *          its fixed attributes and `identityExpiryDays` lifetime, reads it back, expires it on clear, reads an
 *          unreadable cookie as no identity, and does nothing outside a browser.
 * Boundary: test only; jsdom supplies `document.cookie`, and the attribute test records the raw assignment.
 * Runtime: browser (vitest, jsdom)
 * Governing contract: ADR 0022; ADR 0298 (decisions 1 and 5).
 */
// @vitest-environment jsdom
import { buildConfig } from "@stackra/config";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { AnalyticsConfig } from "#config/analytics.config";
import { AnalyticsIdentity } from "#contracts/ports/analytics-identity.port";
import { CookieAnalyticsIdentityDriver } from "#core/drivers/cookie-analytics-identity.driver";

/** A kept identity. */
const RECORD = { anonymousId: "anon_1", userId: "usr_1" };

afterEach(() => {
  new CookieAnalyticsIdentityDriver(buildConfig(AnalyticsConfig)).clear();
  vi.restoreAllMocks();
});

describe("CookieAnalyticsIdentityDriver", () => {
  it("keeps the identity in the cookie and reads it back", () => {
    const identity = new CookieAnalyticsIdentityDriver(buildConfig(AnalyticsConfig));
    expect(identity).toBeInstanceOf(AnalyticsIdentity);
    expect(identity.read()).toBeNull();
    identity.write(RECORD);
    expect(identity.read()).toEqual(RECORD);
    identity.clear();
    expect(identity.read()).toBeNull();
  });

  it("writes the cookie with its name, path, lifetime and SameSite", () => {
    const writes: string[] = [];
    vi.spyOn(document, "cookie", "set").mockImplementation((value: string) => {
      writes.push(value);
    });
    new CookieAnalyticsIdentityDriver(
      buildConfig(AnalyticsConfig, {
        values: { identityCookieName: "aid", identityExpiryDays: 2 },
      }),
    ).write(RECORD);
    expect(writes).toEqual([
      `aid=${encodeURIComponent(JSON.stringify(RECORD))}; Path=/; Max-Age=172800; SameSite=Lax`,
    ]);
  });

  it("reads an unreadable cookie as no identity", () => {
    document.cookie = "stk_aid=%E0%A4%A; Path=/";
    expect(new CookieAnalyticsIdentityDriver(buildConfig(AnalyticsConfig)).read()).toBeNull();
    document.cookie = `stk_aid=${encodeURIComponent('{"userId":"usr_1"}')}; Path=/`;
    expect(new CookieAnalyticsIdentityDriver(buildConfig(AnalyticsConfig)).read()).toBeNull();
  });

  it("does nothing outside a browser", () => {
    vi.stubGlobal("document", undefined);
    const identity = new CookieAnalyticsIdentityDriver(buildConfig(AnalyticsConfig));
    expect(identity.read()).toBeNull();
    expect(() => identity.write(RECORD)).not.toThrow();
    expect(() => identity.clear()).not.toThrow();
    vi.unstubAllGlobals();
  });
});
