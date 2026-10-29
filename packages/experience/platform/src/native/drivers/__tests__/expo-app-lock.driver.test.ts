/**
 * Stackra file contract:
 * Purpose: unit tests of `ExpoAppLockDriver`: availability follows the enrolled security level (a passcode counts only
 *          when allowed), and the prompt passes the reason and turns the device fallback off when the passcode is not
 *          allowed.
 * Boundary: test only; expo-local-authentication is mocked.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0250 (2026-10-29 note).
 */
import { beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { AppLock } from "#contracts/ports/app-lock.port";
import { ExpoAppLockDriver } from "#native/drivers/expo-app-lock.driver";

const mocks = vi.hoisted(() => ({
  level: 0,
  authenticateAsync: vi.fn(async (_options: object) => ({ success: true })),
}));

vi.mock("expo-local-authentication", () => ({
  SecurityLevel: { NONE: 0, SECRET: 1, BIOMETRIC_WEAK: 2, BIOMETRIC_STRONG: 3 },
  getEnrolledLevelAsync: async () => mocks.level,
  authenticateAsync: mocks.authenticateAsync,
}));

describe("ExpoAppLockDriver", () => {
  beforeEach(() => mocks.authenticateAsync.mockClear());

  it("is an AppLock driver", () => {
    expect(new ExpoAppLockDriver()).toBeInstanceOf(AppLock);
  });

  it("counts a passcode only when it is allowed", async () => {
    const lock = new ExpoAppLockDriver();
    mocks.level = 0;
    expect(await lock.canAuthenticate(true)).toBe(false);
    mocks.level = 1;
    expect(await lock.canAuthenticate(true)).toBe(true);
    expect(await lock.canAuthenticate(false)).toBe(false);
    mocks.level = 3;
    expect(await lock.canAuthenticate(false)).toBe(true);
  });

  it("prompts with the reason and the passcode fallback as allowed", async () => {
    const lock = new ExpoAppLockDriver();
    expect(await lock.authenticate("Unlock Stackra", false)).toBe(true);
    expect(mocks.authenticateAsync).toHaveBeenCalledWith({
      promptMessage: "Unlock Stackra",
      disableDeviceFallback: true,
    });
    mocks.authenticateAsync.mockResolvedValueOnce({ success: false });
    expect(await lock.authenticate("Unlock Stackra", true)).toBe(false);
  });
});
