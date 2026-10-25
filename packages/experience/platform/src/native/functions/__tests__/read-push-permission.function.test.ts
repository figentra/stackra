/**
 * Stackra file contract:
 * Purpose: unit tests of `readPushPermission`: granted, iOS provisional and undetermined read as the port spells them;
 *          anything else reads `denied`.
 * Boundary: test only; expo-notifications is mocked.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0255 (decision 3).
 */
import { beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { readPushPermission } from "#native/functions/read-push-permission.function";

const notifications = vi.hoisted(() => ({ getPermissionsAsync: vi.fn() }));

vi.mock("expo-notifications", () => ({
  getPermissionsAsync: notifications.getPermissionsAsync,
  IosAuthorizationStatus: { PROVISIONAL: 3 },
}));

beforeEach(() => {
  notifications.getPermissionsAsync.mockReset();
});

describe("readPushPermission", () => {
  it("reads granted, provisional, undetermined and denied", async () => {
    notifications.getPermissionsAsync.mockResolvedValueOnce({ granted: true, status: "granted" });
    expect(await readPushPermission()).toBe("granted");
    notifications.getPermissionsAsync.mockResolvedValueOnce({
      granted: false,
      status: "denied",
      ios: { status: 3 },
    });
    expect(await readPushPermission()).toBe("granted");
    notifications.getPermissionsAsync.mockResolvedValueOnce({
      granted: false,
      status: "undetermined",
    });
    expect(await readPushPermission()).toBe("prompt");
    notifications.getPermissionsAsync.mockResolvedValueOnce({ granted: false, status: "denied" });
    expect(await readPushPermission()).toBe("denied");
  });
});
