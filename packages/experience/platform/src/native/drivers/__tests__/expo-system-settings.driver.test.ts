/**
 * Stackra file contract:
 * Purpose: unit tests of `ExpoSystemSettingsDriver`: tracking reads through expo-tracking-transparency on iOS in an app
 *          that asks for it, reads `denied` without calling it in one that does not (and without the library) and
 *          `null` elsewhere, prompts only when undecided; Low Power Mode follows
 *          expo-battery; background refresh maps expo-background-task's status; an expensive connection follows
 *          NetInfo; the settings deep link opens; constructed bare, it reads through the Expo libraries it imports.
 * Boundary: test only; react-native, NetInfo and the Expo libraries are mocked, and a subclass also hands fakes in.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0250 (2026-10-29 note); ADR 0071 (decision 4).
 */
import { beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { SystemSettings } from "#contracts/ports/system-settings.port";
import { ExpoSystemSettingsDriver } from "#native/drivers/expo-system-settings.driver";
import type { ExpoSystemModules } from "#native/types/expo-system-modules.type";

const mocks = vi.hoisted(() => ({
  os: { OS: "ios" },
  openSettings: vi.fn(async () => undefined),
  netInfo: [] as ((state: { details: { isConnectionExpensive: boolean } | null }) => void)[],
}));

vi.mock("react-native", () => ({
  Linking: { openSettings: mocks.openSettings },
  Platform: mocks.os,
}));
vi.mock("expo-tracking-transparency", () => ({
  getTrackingPermissionsAsync: async () => ({ granted: true, status: "granted" }),
  requestTrackingPermissionsAsync: async () => ({ granted: true, status: "granted" }),
}));
vi.mock("expo-battery", () => ({
  isLowPowerModeEnabledAsync: async () => false,
  addLowPowerModeListener: () => ({ remove: () => undefined }),
}));
vi.mock("expo-background-task", () => ({
  BackgroundTaskStatus: { Restricted: 1, Available: 2 },
  getStatusAsync: async () => 2,
}));
vi.mock("@react-native-community/netinfo", () => ({
  addEventListener: (listener: (typeof mocks.netInfo)[number]) => {
    mocks.netInfo.push(listener);
    return () => undefined;
  },
}));

/** A driver over `modules`, as the host declares it; `asks` stands for an app with the tracking usage string. */
function driverWith(
  modules: Partial<ExpoSystemModules> = {},
  asks = true,
): ExpoSystemSettingsDriver {
  const all: ExpoSystemModules = {
    trackingTransparency: null,
    battery: null,
    backgroundTask: null,
    ...modules,
  };
  return new (class extends ExpoSystemSettingsDriver {
    protected override readonly modules = all;

    protected override readonly asksForTracking = asks;
  })();
}

beforeEach(() => {
  mocks.os.OS = "ios";
  mocks.netInfo.length = 0;
});

describe("ExpoSystemSettingsDriver", () => {
  it("reads through the Expo libraries it imports when constructed bare", async () => {
    const settings = new ExpoSystemSettingsDriver();
    expect(await settings.tracking()).toBe("denied");
    expect(await settings.backgroundRefresh()).toBe("granted");
    expect(settings.lowPowerMode.get()).toBe(false);
  });

  it("reads tracking through expo-tracking-transparency and prompts only when undecided", async () => {
    const request = vi.fn(async () => ({ granted: true, status: "granted" }));
    const settings = driverWith({
      trackingTransparency: {
        getTrackingPermissionsAsync: async () => ({ granted: false, status: "undetermined" }),
        requestTrackingPermissionsAsync: request,
      },
    });
    expect(settings).toBeInstanceOf(SystemSettings);
    expect(await settings.tracking()).toBe("prompt");
    expect(await settings.requestTracking()).toBe("granted");
    expect(request).toHaveBeenCalledTimes(1);
  });

  it("never calls the library in an app that does not ask for tracking (no usage string: its read is fatal)", async () => {
    const read = vi.fn(async () => ({ granted: false, status: "undetermined" }));
    const request = vi.fn(async () => ({ granted: true, status: "granted" }));
    const settings = driverWith(
      {
        trackingTransparency: {
          getTrackingPermissionsAsync: read,
          requestTrackingPermissionsAsync: request,
        },
      },
      false,
    );
    expect(await settings.tracking()).toBe("denied");
    expect(await settings.requestTracking()).toBe("denied");
    expect(read).not.toHaveBeenCalled();
    expect(request).not.toHaveBeenCalled();
  });

  it("reads tracking as refused on iOS without the library, and as no control elsewhere", async () => {
    expect(await driverWith().tracking()).toBe("denied");
    expect(await driverWith().requestTracking()).toBe("denied");
    mocks.os.OS = "android";
    expect(await driverWith().tracking()).toBeNull();
  });

  it("follows Low Power Mode from expo-battery", async () => {
    let report: ((event: { readonly lowPowerMode: boolean }) => void) | undefined;
    const settings = driverWith({
      battery: {
        isLowPowerModeEnabledAsync: async () => true,
        addLowPowerModeListener: (listener) => {
          report = listener;
          return { remove: () => undefined };
        },
      },
    });
    const lowPower = settings.lowPowerMode;
    await Promise.resolve();
    expect(lowPower.get()).toBe(true);
    report?.({ lowPowerMode: false });
    expect(settings.lowPowerMode.get()).toBe(false);
    expect(driverWith().lowPowerMode.get()).toBe(false);
  });

  it("maps background refresh from expo-background-task", async () => {
    expect(
      await driverWith({ backgroundTask: { getStatusAsync: async () => 2 } }).backgroundRefresh(),
    ).toBe("granted");
    expect(
      await driverWith({ backgroundTask: { getStatusAsync: async () => 1 } }).backgroundRefresh(),
    ).toBe("denied");
    expect(await driverWith().backgroundRefresh()).toBeNull();
  });

  it("follows an expensive connection and opens the settings", async () => {
    const settings = driverWith();
    mocks.netInfo.at(-1)?.({ details: { isConnectionExpensive: true } });
    expect(settings.expensiveNetwork.get()).toBe(true);
    mocks.netInfo.at(-1)?.({ details: null });
    expect(settings.expensiveNetwork.get()).toBe(false);
    await settings.openSettings();
    expect(mocks.openSettings).toHaveBeenCalled();
  });
});
