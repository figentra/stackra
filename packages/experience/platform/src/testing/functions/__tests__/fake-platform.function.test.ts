/**
 * Stackra file contract:
 * Purpose: unit tests of `fakePlatform()`: each call is a fresh memory platform with the template's options applied
 *          (online state, a scanner with or without a camera, a refused notification permission).
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269 (decision 3).
 */
import { describe, expect, it } from "@stackra/testing";

import { MemoryPlatformDriver } from "#core/drivers/memory-platform.driver";
import { Capability } from "#core/enums/capability.enum";
import { fakePlatform } from "#testing/functions/fake-platform.function";

describe("fakePlatform", () => {
  it("is a fresh memory platform per call", () => {
    const first = fakePlatform();
    expect(first).toBeInstanceOf(MemoryPlatformDriver);
    expect(fakePlatform()).not.toBe(first);
  });

  it("applies the template's options", async () => {
    expect(fakePlatform({ network: { isOnline: false } }).network.isOnline.get()).toBe(false);
    expect(fakePlatform({ scanner: { isAvailable: false } }).scanner.isAvailable).toBe(false);
    expect(
      fakePlatform({ scanner: { isAvailable: true, permission: "granted" } }).scanner.permission,
    ).toBe("granted");
    const refusing = fakePlatform({
      capabilities: [Capability.LocalNotifications],
      permissions: { [Capability.LocalNotifications]: "denied" },
    });
    const granted = await refusing.notifications.requestPermission();
    expect(granted.ok || granted.error.code).toBe("permission_denied");
  });
});
