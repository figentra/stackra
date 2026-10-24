/**
 * Stackra file contract:
 * Purpose: unit tests of `hasGlobalPrivacyControl`: `true` only when `navigator.globalPrivacyControl` is exactly
 *          `true`, `false` without a navigator, and read on every call.
 * Boundary: test only; stubs the global navigator and restores it after each test.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0298 (decision 2).
 */
import { afterEach, describe, expect, it, vi } from "@stackra/testing";

import { hasGlobalPrivacyControl } from "#core/functions/has-global-privacy-control.function";

describe("hasGlobalPrivacyControl", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("is on when the browser sends the signal", () => {
    vi.stubGlobal("navigator", { globalPrivacyControl: true });
    expect(hasGlobalPrivacyControl()).toBe(true);
  });

  it.each([[false], [undefined], ["true"], [1]])("is off for %j", (value) => {
    vi.stubGlobal("navigator", { globalPrivacyControl: value });
    expect(hasGlobalPrivacyControl()).toBe(false);
  });

  it("is off without a navigator", () => {
    vi.stubGlobal("navigator", undefined);
    expect(hasGlobalPrivacyControl()).toBe(false);
  });

  it("reads the signal on every call", () => {
    vi.stubGlobal("navigator", { globalPrivacyControl: false });
    expect(hasGlobalPrivacyControl()).toBe(false);
    vi.stubGlobal("navigator", { globalPrivacyControl: true });
    expect(hasGlobalPrivacyControl()).toBe(true);
  });
});
