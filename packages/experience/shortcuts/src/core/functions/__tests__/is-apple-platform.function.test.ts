/**
 * Stackra file contract:
 * Purpose: unit tests of `isApplePlatform`: Client Hints win over `navigator.platform`, Apple platforms are detected,
 *          and no navigator means `false`.
 * Boundary: test only; stubs the `navigator` global per test and restores it.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269.
 */
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { isApplePlatform } from "#core/functions/is-apple-platform.function";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("isApplePlatform", () => {
  it("is true on a Mac, iPhone or iPad", () => {
    for (const platform of ["MacIntel", "iPhone", "iPad"]) {
      vi.stubGlobal("navigator", { platform });
      expect(isApplePlatform(), platform).toBe(true);
    }
  });

  it("prefers Client Hints and is false elsewhere", () => {
    vi.stubGlobal("navigator", { platform: "MacIntel", userAgentData: { platform: "Windows" } });
    expect(isApplePlatform()).toBe(false);
    vi.stubGlobal("navigator", { userAgentData: { platform: "macOS" } });
    expect(isApplePlatform()).toBe(true);
    vi.stubGlobal("navigator", { platform: "Linux x86_64" });
    expect(isApplePlatform()).toBe(false);
  });

  it("is false without a navigator", () => {
    vi.stubGlobal("navigator", undefined);
    expect(isApplePlatform()).toBe(false);
  });
});
