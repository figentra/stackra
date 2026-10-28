/**
 * Stackra file contract:
 * Purpose: unit tests of `nativeSwitcherMode`: the configured mode on iOS and Android 13 and later, and `in_app` below
 *          Android 13, which has no per-app language screen.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0080 (2026-10-29 note).
 */
import { describe, expect, it } from "@stackra/testing";

import { NativeSwitcher } from "#core/enums/native-switcher.enum";
import { nativeSwitcherMode } from "#core/functions/native-switcher-mode.function";

describe("nativeSwitcherMode", () => {
  it("keeps the configured mode on iOS and Android 13 and later", () => {
    expect(nativeSwitcherMode(NativeSwitcher.System, "ios", "18.0")).toBe("system");
    expect(nativeSwitcherMode(NativeSwitcher.System, "android", 33)).toBe("system");
    expect(nativeSwitcherMode(NativeSwitcher.InApp, "ios", "18.0")).toBe("in_app");
  });

  it("falls back to in_app below Android 13", () => {
    expect(nativeSwitcherMode(NativeSwitcher.System, "android", 32)).toBe("in_app");
  });
});
