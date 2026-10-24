/**
 * Stackra file contract:
 * Purpose: unit tests of `SelfHostedPushTransportDriver`: it refuses to register without a granted permission and
 *          registers the native device token as `apns` on iOS and `fcm` on Android.
 * Boundary: test only; expo-notifications and react-native are mocked.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0255 (decision 3).
 */
import { buildConfig } from "@stackra/config";
import { beforeEach, describe, expect, it, vi } from "@stackra/testing";

import { PushConfig } from "#config/push.config";
import { PushTransport } from "#contracts/ports/push-transport.port";
import { SelfHostedPushTransportDriver } from "#native/drivers/self-hosted-push-transport.driver";

const mocks = vi.hoisted(() => ({
  getPermissionsAsync: vi.fn(),
  getDevicePushTokenAsync: vi.fn(),
}));

vi.mock("expo-notifications", () => ({
  getPermissionsAsync: mocks.getPermissionsAsync,
  getDevicePushTokenAsync: mocks.getDevicePushTokenAsync,
  IosAuthorizationStatus: { PROVISIONAL: 3 },
}));
vi.mock("react-native", () => ({ Linking: { openSettings: vi.fn(async () => undefined) } }));

beforeEach(() => {
  mocks.getPermissionsAsync.mockReset().mockResolvedValue({ granted: true, status: "granted" });
  mocks.getDevicePushTokenAsync.mockReset();
});

describe("SelfHostedPushTransportDriver", () => {
  it("refuses to register without the permission", async () => {
    mocks.getPermissionsAsync.mockResolvedValue({ granted: false, status: "denied" });
    const transport = new SelfHostedPushTransportDriver(buildConfig(PushConfig));
    expect(transport).toBeInstanceOf(PushTransport);
    expect((await transport.register()).ok).toBe(false);
  });

  it("names the gateway of the native token", async () => {
    const transport = new SelfHostedPushTransportDriver(buildConfig(PushConfig));
    mocks.getDevicePushTokenAsync.mockResolvedValueOnce({ type: "ios", data: "apns-token" });
    expect(await transport.register()).toEqual({
      ok: true,
      data: { provider: "apns", token: "apns-token" },
    });
    mocks.getDevicePushTokenAsync.mockResolvedValueOnce({ type: "android", data: "fcm-token" });
    expect(await transport.register()).toEqual({
      ok: true,
      data: { provider: "fcm", token: "fcm-token" },
    });
  });
});
