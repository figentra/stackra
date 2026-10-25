/**
 * Stackra file contract:
 * Purpose: unit tests of `requestPushPermission`: a decided permission is answered without a prompt; an undecided one
 *          shows the OS prompt with the app's provisional choice and answers where it ends up.
 * Boundary: test only; expo-notifications is mocked.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0255 (decision 3).
 */
import { buildConfig } from "@stackra/config";
import { beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { PushConfig } from "#config/push.config";
import { requestPushPermission } from "#native/functions/request-push-permission.function";

const notifications = vi.hoisted(() => ({
  getPermissionsAsync: vi.fn(),
  requestPermissionsAsync: vi.fn(),
}));

vi.mock("expo-notifications", () => ({
  getPermissionsAsync: notifications.getPermissionsAsync,
  requestPermissionsAsync: notifications.requestPermissionsAsync,
  IosAuthorizationStatus: { PROVISIONAL: 3 },
}));

beforeEach(() => {
  notifications.getPermissionsAsync.mockReset();
  notifications.requestPermissionsAsync.mockReset().mockResolvedValue({});
});

describe("requestPushPermission", () => {
  it("answers a decided permission without a prompt", async () => {
    notifications.getPermissionsAsync.mockResolvedValue({ granted: false, status: "denied" });
    expect(await requestPushPermission(buildConfig(PushConfig))).toBe("denied");
    expect(notifications.requestPermissionsAsync).not.toHaveBeenCalled();
  });

  it("prompts an undecided permission with the provisional choice", async () => {
    notifications.getPermissionsAsync
      .mockResolvedValueOnce({ granted: false, status: "undetermined" })
      .mockResolvedValueOnce({ granted: true, status: "granted" });
    const config = buildConfig(PushConfig, { values: { iosProvisional: true } });
    expect(await requestPushPermission(config)).toBe("granted");
    expect(notifications.requestPermissionsAsync).toHaveBeenCalledWith({
      ios: { allowAlert: true, allowBadge: true, allowSound: true, allowProvisional: true },
    });
  });
});
