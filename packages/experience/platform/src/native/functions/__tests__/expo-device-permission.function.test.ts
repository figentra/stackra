/**
 * Stackra file contract:
 * Purpose: unit tests of `expoDevicePermission`: granted, unasked, refused and refused for good.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0250 (2026-10-29 note).
 */
import { describe, expect, it } from "@stackra/testing";

import { expoDevicePermission } from "#native/functions/expo-device-permission.function";

describe("expoDevicePermission", () => {
  it("maps each Expo response onto the port's spelling", () => {
    expect(expoDevicePermission({ granted: true, status: "granted", canAskAgain: true })).toBe(
      "granted",
    );
    expect(
      expoDevicePermission({ granted: false, status: "undetermined", canAskAgain: true }),
    ).toBe("prompt");
    expect(expoDevicePermission({ granted: false, status: "denied", canAskAgain: true })).toBe(
      "denied",
    );
    expect(expoDevicePermission({ granted: false, status: "denied", canAskAgain: false })).toBe(
      "blocked",
    );
  });
});
