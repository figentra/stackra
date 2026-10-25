/**
 * Stackra file contract:
 * Purpose: unit tests of `ExpoPlatformDriver`: it is a `Platform` that offers what a phone has and answers false for
 *          the rest; online state follows NetInfo; notifications, the badge, the share sheet, haptics and the scanner
 *          permission each call their Expo module and refuse as the port says.
 * Boundary: test only; NetInfo, expo-notifications, expo-haptics, expo-camera and react-native are mocked.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0250 (decisions 2 and 3); ADR 0281 (decision 2).
 */
import { beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { Platform } from "#contracts/ports/platform.port";
import { Capability } from "#core/enums/capability.enum";
import { ExpoPlatformDriver } from "#native/drivers/expo-platform.driver";

const mocks = vi.hoisted(() => ({
  listener: undefined as undefined | ((state: Record<string, boolean | null>) => void),
  getPermissionsAsync: vi.fn(),
  requestPermissionsAsync: vi.fn(),
  scheduleNotificationAsync: vi.fn(async () => "id"),
  setBadgeCountAsync: vi.fn(),
  impactAsync: vi.fn(async () => undefined),
  share: vi.fn(),
  getCameraPermissionsAsync: vi.fn(),
  requestCameraPermissionsAsync: vi.fn(),
  isAvailableAsync: vi.fn(),
  os: { OS: "ios" },
}));

vi.mock("@react-native-community/netinfo", () => ({
  default: { addEventListener: (fn: typeof mocks.listener) => (mocks.listener = fn) },
}));
vi.mock("expo-notifications", () => ({
  getPermissionsAsync: mocks.getPermissionsAsync,
  requestPermissionsAsync: mocks.requestPermissionsAsync,
  scheduleNotificationAsync: mocks.scheduleNotificationAsync,
  setBadgeCountAsync: mocks.setBadgeCountAsync,
  IosAuthorizationStatus: { PROVISIONAL: 3 },
}));
vi.mock("expo-haptics", () => ({
  impactAsync: mocks.impactAsync,
  ImpactFeedbackStyle: { Light: "light", Medium: "medium", Heavy: "heavy" },
}));
vi.mock("expo-camera", () => ({
  Camera: {
    getCameraPermissionsAsync: mocks.getCameraPermissionsAsync,
    requestCameraPermissionsAsync: mocks.requestCameraPermissionsAsync,
  },
  CameraView: { isAvailableAsync: mocks.isAvailableAsync },
}));
vi.mock("react-native", () => ({
  Platform: mocks.os,
  Share: { share: mocks.share, sharedAction: "sharedAction", dismissedAction: "dismissedAction" },
}));

beforeEach(() => {
  mocks.os.OS = "ios";
  mocks.getPermissionsAsync.mockReset().mockResolvedValue({ granted: true, status: "granted" });
  mocks.requestPermissionsAsync.mockReset().mockResolvedValue({});
  mocks.scheduleNotificationAsync.mockClear();
  mocks.setBadgeCountAsync.mockReset().mockResolvedValue(true);
  mocks.impactAsync.mockClear();
  mocks.share.mockReset().mockResolvedValue({ action: "sharedAction" });
  mocks.getCameraPermissionsAsync
    .mockReset()
    .mockResolvedValue({ granted: false, status: "undetermined" });
  mocks.requestCameraPermissionsAsync
    .mockReset()
    .mockResolvedValue({ granted: true, status: "granted" });
  mocks.isAvailableAsync.mockReset().mockResolvedValue(true);
});

describe("ExpoPlatformDriver", () => {
  it("is a Platform that offers what a phone has", () => {
    const platform = new ExpoPlatformDriver();
    expect(platform).toBeInstanceOf(Platform);
    for (const code of [
      Capability.Network,
      Capability.Haptics,
      Capability.Scanner,
      Capability.Share,
    ])
      expect(platform.has(code)).toBe(true);
    for (const code of [
      Capability.FileHandling,
      Capability.ShareTarget,
      Capability.InstallPrompt,
      Capability.Tray,
    ])
      expect(platform.has(code)).toBe(false);
  });

  it("follows NetInfo for the online state", () => {
    const platform = new ExpoPlatformDriver();
    mocks.listener?.({ isConnected: false, isInternetReachable: false });
    expect(platform.network.isOnline.get()).toBe(false);
    mocks.listener?.({ isConnected: true, isInternetReachable: null });
    expect(platform.network.isOnline.get()).toBe(true);
  });

  it("asks for the notification permission and shows a notification", async () => {
    mocks.getPermissionsAsync.mockResolvedValue({ granted: false, status: "denied" });
    const platform = new ExpoPlatformDriver();
    expect(await platform.notifications.requestPermission()).toEqual({
      ok: false,
      error: { code: "permission_denied", capability: "local_notifications" },
    });
    expect(await platform.notifications.notify("Hi")).toMatchObject({ ok: false });

    mocks.getPermissionsAsync.mockResolvedValue({ granted: true, status: "granted" });
    expect(await platform.notifications.requestPermission()).toEqual({ ok: true, data: undefined });
    expect(platform.notifications.permission).toBe("granted");
    await platform.notifications.notify("Hi", { body: "there", tag: "t1" });
    expect(mocks.scheduleNotificationAsync).toHaveBeenCalledWith({
      identifier: "t1",
      content: { title: "Hi", body: "there" },
      trigger: null,
    });
  });

  it("sets and clears the badge, refusing where the launcher takes none", async () => {
    const platform = new ExpoPlatformDriver();
    expect(await platform.badge.set(3)).toEqual({ ok: true, data: undefined });
    expect(mocks.setBadgeCountAsync).toHaveBeenCalledWith(3);
    mocks.setBadgeCountAsync.mockResolvedValue(false);
    expect(await platform.badge.clear()).toEqual({
      ok: false,
      error: { code: "unavailable", capability: "badge" },
    });
  });

  it("shares through the share sheet and reports a closed sheet", async () => {
    const platform = new ExpoPlatformDriver();
    expect(await platform.share.share({ text: "look", url: "https://x.test" })).toEqual({
      ok: true,
      data: true,
    });
    expect(mocks.share).toHaveBeenCalledWith({
      title: undefined,
      message: "look",
      url: "https://x.test",
    });
    mocks.share.mockResolvedValue({ action: "dismissedAction" });
    expect(await platform.share.share({ text: "look" })).toEqual({ ok: true, data: false });
    mocks.os.OS = "android";
    await platform.share.share({ text: "look", url: "https://x.test" });
    expect(mocks.share).toHaveBeenLastCalledWith({
      title: undefined,
      message: "look\nhttps://x.test",
    });
    expect(await platform.share.share({ files: [new File([], "a.txt")] })).toMatchObject({
      ok: false,
    });
  });

  it("taps with the requested strength", async () => {
    const platform = new ExpoPlatformDriver();
    expect(await platform.haptics.impact("heavy")).toEqual({ ok: true, data: undefined });
    expect(mocks.impactAsync).toHaveBeenCalledWith("heavy");
  });

  it("reads the camera and asks for its permission", async () => {
    const platform = new ExpoPlatformDriver();
    await Promise.resolve();
    await Promise.resolve();
    expect(platform.scanner.isAvailable).toBe(true);
    expect(platform.scanner.permission).toBe("prompt");
    expect(await platform.scanner.requestPermission()).toBe("granted");
    expect(platform.scanner.permission).toBe("granted");
  });

  it("offers nothing for files, shares from other apps or installing", async () => {
    const platform = new ExpoPlatformDriver();
    expect(platform.fileHandling.launched.get()).toEqual([]);
    expect(await platform.shareTarget.take("x")).toBeNull();
    expect(platform.install.canPrompt.get()).toBe(false);
    expect(await platform.install.prompt()).toEqual({
      ok: false,
      error: { code: "unavailable", capability: "install_prompt" },
    });
  });
});
