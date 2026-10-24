/**
 * Stackra file contract:
 * Purpose: unit tests of `ExpoPushTransportDriver`: it refuses to register without a granted permission, registers an
 *          Expo push token for the build's EAS project, and opens the OS settings.
 * Boundary: test only; expo-notifications, expo-constants and react-native are mocked.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0255 (decision 3).
 */
import { buildConfig } from "@stackra/config";
import { beforeEach, describe, expect, it, vi } from "@stackra/testing";

import { PushConfig } from "#config/push.config";
import { PushTransport } from "#contracts/ports/push-transport.port";
import { ExpoPushTransportDriver } from "#native/drivers/expo-push-transport.driver";

const mocks = vi.hoisted(() => ({
  getPermissionsAsync: vi.fn(),
  getExpoPushTokenAsync: vi.fn(),
  openSettings: vi.fn(async () => undefined),
}));

vi.mock("expo-notifications", () => ({
  getPermissionsAsync: mocks.getPermissionsAsync,
  getExpoPushTokenAsync: mocks.getExpoPushTokenAsync,
  IosAuthorizationStatus: { PROVISIONAL: 3 },
}));
vi.mock("expo-constants", () => ({
  default: { easConfig: { projectId: "proj_1" }, expoConfig: null },
}));
vi.mock("react-native", () => ({ Linking: { openSettings: mocks.openSettings } }));

beforeEach(() => {
  mocks.getPermissionsAsync.mockReset();
  mocks.getExpoPushTokenAsync
    .mockReset()
    .mockResolvedValue({ type: "expo", data: "ExponentPushToken[x]" });
});

describe("ExpoPushTransportDriver", () => {
  it("refuses to register without the permission", async () => {
    mocks.getPermissionsAsync.mockResolvedValue({ granted: false, status: "undetermined" });
    const transport = new ExpoPushTransportDriver(buildConfig(PushConfig));
    expect(transport).toBeInstanceOf(PushTransport);
    expect(await transport.permission()).toBe("prompt");
    expect(await transport.register()).toEqual({
      ok: false,
      error: { code: "permission_denied", capability: "push" },
    });
  });

  it("registers an Expo push token for the EAS project", async () => {
    mocks.getPermissionsAsync.mockResolvedValue({ granted: true, status: "granted" });
    const transport = new ExpoPushTransportDriver(buildConfig(PushConfig));
    expect(await transport.register()).toEqual({
      ok: true,
      data: { provider: "expo", token: "ExponentPushToken[x]" },
    });
    expect(mocks.getExpoPushTokenAsync).toHaveBeenCalledWith({ projectId: "proj_1" });
  });

  it("opens the OS settings", async () => {
    await new ExpoPushTransportDriver(buildConfig(PushConfig)).openSettings();
    expect(mocks.openSettings).toHaveBeenCalled();
  });
});
