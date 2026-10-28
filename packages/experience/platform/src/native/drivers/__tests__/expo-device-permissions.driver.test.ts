/**
 * Stackra file contract:
 * Purpose: unit tests of `ExpoDevicePermissionsDriver`: camera, microphone, location and photos read and prompt
 *          through the Expo libraries, a refusal the OS will not ask about again reads `blocked` and is not asked
 *          again, a missing library reads `denied`, Bluetooth asks through `PermissionsAndroid` on Android 12 and
 *          later only, and the settings deep link opens.
 * Boundary: test only; react-native is mocked, and the Expo libraries are handed over as fakes.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0250 (2026-10-29 note).
 */
import { beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { DevicePermissions } from "#contracts/ports/device-permissions.port";
import { ExpoDevicePermissionsDriver } from "#native/drivers/expo-device-permissions.driver";
import type { ExpoPermissionModules } from "#native/types/expo-permission-modules.type";
import type { ExpoPermissionResponse } from "#native/types/expo-permission-response.type";

const mocks = vi.hoisted(() => ({
  os: { OS: "android", Version: 34 as number | string },
  openSettings: vi.fn(async () => undefined),
  check: vi.fn(async (_name: string) => false),
  requestMultiple: vi.fn(async (names: string[]) =>
    Object.fromEntries(names.map((name) => [name, "granted"])),
  ),
}));

vi.mock("react-native", () => ({
  Linking: { openSettings: mocks.openSettings },
  PermissionsAndroid: { check: mocks.check, requestMultiple: mocks.requestMultiple },
  Platform: mocks.os,
}));

const UNASKED: ExpoPermissionResponse = {
  granted: false,
  status: "undetermined",
  canAskAgain: true,
};
const GRANTED: ExpoPermissionResponse = { granted: true, status: "granted", canAskAgain: true };
const BLOCKED: ExpoPermissionResponse = { granted: false, status: "denied", canAskAgain: false };

/** A driver over `modules`, as the host declares it. */
function driverWith(modules: Partial<ExpoPermissionModules> = {}): ExpoDevicePermissionsDriver {
  const all: ExpoPermissionModules = {
    camera: null,
    location: null,
    mediaLibrary: null,
    ...modules,
  };
  return new (class extends ExpoDevicePermissionsDriver {
    protected override readonly modules = all;
  })();
}

beforeEach(() => {
  mocks.os.OS = "android";
  mocks.os.Version = 34;
  mocks.check.mockClear();
  mocks.requestMultiple.mockClear();
});

describe("ExpoDevicePermissionsDriver", () => {
  it("is a DevicePermissions driver", () => {
    expect(driverWith()).toBeInstanceOf(DevicePermissions);
  });

  it("prompts for the camera through expo-camera when unasked", async () => {
    const request = vi.fn(async () => GRANTED);
    const permissions = driverWith({
      camera: {
        getCameraPermissionsAsync: async () => UNASKED,
        requestCameraPermissionsAsync: request,
        getMicrophonePermissionsAsync: async () => GRANTED,
        requestMicrophonePermissionsAsync: async () => GRANTED,
      },
    });
    expect(await permissions.status("camera")).toBe("prompt");
    expect(await permissions.request("camera")).toBe("granted");
    expect(await permissions.status("microphone")).toBe("granted");
    expect(request).toHaveBeenCalledOnce();
  });

  it("reads a final refusal as blocked and does not prompt again", async () => {
    const request = vi.fn(async () => BLOCKED);
    const permissions = driverWith({
      location: {
        getForegroundPermissionsAsync: async () => BLOCKED,
        requestForegroundPermissionsAsync: request,
      },
    });
    expect(await permissions.request("location")).toBe("blocked");
    expect(request).not.toHaveBeenCalled();
  });

  it("reads a permission whose library the app does not ship as denied", async () => {
    const permissions = driverWith();
    expect(await permissions.status("photos")).toBe("denied");
    expect(await permissions.request("photos")).toBe("denied");
  });

  it("asks for Bluetooth scan and connect on Android 12 and later", async () => {
    const permissions = driverWith();
    expect(await permissions.status("bluetooth")).toBe("prompt");
    expect(await permissions.request("bluetooth")).toBe("granted");
    mocks.requestMultiple.mockResolvedValueOnce({
      "android.permission.BLUETOOTH_SCAN": "granted",
      "android.permission.BLUETOOTH_CONNECT": "never_ask_again",
    });
    expect(await permissions.request("bluetooth")).toBe("blocked");
  });

  it("reads Bluetooth as granted where the OS does not ask at run time", async () => {
    mocks.os.Version = 30;
    expect(await driverWith().request("bluetooth")).toBe("granted");
    mocks.os.OS = "ios";
    expect(await driverWith().status("bluetooth")).toBe("granted");
    expect(mocks.requestMultiple).not.toHaveBeenCalled();
  });

  it("opens the app's settings page", async () => {
    await driverWith().openSettings();
    expect(mocks.openSettings).toHaveBeenCalledOnce();
  });
});
