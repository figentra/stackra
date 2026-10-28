/**
 * Stackra file contract:
 * Purpose: `ExpoDevicePermissionsDriver`, the `DevicePermissions` driver of the Expo (phone) target: camera and
 *          microphone through expo-camera, location through expo-location, photos through expo-media-library,
 *          Bluetooth through React Native's `PermissionsAndroid`, and the settings deep link from `Linking`.
 * Boundary: device only, and abstract: the host app subclasses it and declares `modules` (the Expo libraries it ships),
 *           because those libraries are the app's own dependencies; the constructor takes nothing. A library the app
 *           does not ship reads `denied`. Bluetooth is a runtime permission on Android 12 (API 31) and later only
 *           (scan and connect); below that it is granted at install, and on iOS the OS asks on first use, so both read
 *           `granted`. Android's `check` cannot tell unasked from refused, so a missing Bluetooth grant reads `prompt`.
 * Runtime: react-native
 * Governing contract: ADR 0250 (2026-10-29 note); ADR 0478 (Expo's own libraries, no hand-written native code).
 */
import { Driver } from "@stackra/container";
import { Linking, PermissionsAndroid, Platform as Os } from "react-native";

import { DevicePermissions } from "#contracts/ports/device-permissions.port";
import type { DevicePermission } from "#contracts/types/device-permission.type";
import type { DevicePermissionStatus } from "#contracts/types/device-permission-status.type";
import { expoDevicePermission } from "#native/functions/expo-device-permission.function";
import type { ExpoPermissionModules } from "#native/types/expo-permission-modules.type";
import type { ExpoPermissionResponse } from "#native/types/expo-permission-response.type";

/** The Android 12 (API 31) runtime permissions a Bluetooth scan and connection need. */
const BLUETOOTH = [
  "android.permission.BLUETOOTH_SCAN",
  "android.permission.BLUETOOTH_CONNECT",
] as const;

/** The first Android API level where Bluetooth asks at run time. */
const BLUETOOTH_RUNTIME_API = 31;

/**
 * Device permissions on a phone.
 *
 * @example
 * import { Camera } from "expo-camera";
 * import * as Location from "expo-location";
 * import * as MediaLibrary from "expo-media-library";
 *
 * export class AppDevicePermissionsDriver extends ExpoDevicePermissionsDriver {
 *   protected readonly modules = { camera: Camera, location: Location, mediaLibrary: MediaLibrary };
 * }
 */
export abstract class ExpoDevicePermissionsDriver extends Driver(DevicePermissions) {
  /** The Expo libraries the app ships; declared by the host's subclass. */
  protected abstract readonly modules: ExpoPermissionModules;

  /** Where `permission` stands, without prompting. */
  async status(permission: DevicePermission): Promise<DevicePermissionStatus> {
    if (permission === "bluetooth") {
      if (!this.bluetoothAsks()) return "granted";
      const checks = await Promise.all(BLUETOOTH.map((name) => PermissionsAndroid.check(name)));
      return checks.every(Boolean) ? "granted" : "prompt";
    }
    const read = this.expo(permission, false);
    return read === null ? "denied" : expoDevicePermission(await read);
  }

  /** Prompts for `permission` when the OS still may; a granted or blocked one is not asked again. */
  async request(permission: DevicePermission): Promise<Exclude<DevicePermissionStatus, "prompt">> {
    if (permission === "bluetooth") {
      if (!this.bluetoothAsks()) return "granted";
      const results = Object.values(await PermissionsAndroid.requestMultiple([...BLUETOOTH]));
      if (results.every((result) => result === "granted")) return "granted";
      return results.includes("never_ask_again") ? "blocked" : "denied";
    }
    const current = await this.status(permission);
    if (current === "granted" || current === "blocked") return current;
    const asked = this.expo(permission, true);
    const answer = asked === null ? "denied" : expoDevicePermission(await asked);
    return answer === "prompt" ? "denied" : answer;
  }

  /** Opens this app's page in the OS settings. */
  openSettings(): Promise<void> {
    return Linking.openSettings();
  }

  /** Whether this phone asks for Bluetooth at run time (Android 12 and later). */
  private bluetoothAsks(): boolean {
    return Os.OS === "android" && Number(Os.Version) >= BLUETOOTH_RUNTIME_API;
  }

  /** Reads (`prompt` false) or prompts for `permission` through its library; `null` when the app lacks it. */
  private expo(
    permission: Exclude<DevicePermission, "bluetooth">,
    prompt: boolean,
  ): Promise<ExpoPermissionResponse> | null {
    const { camera, location, mediaLibrary } = this.modules;
    switch (permission) {
      case "camera": {
        if (camera === null) return null;
        return prompt ? camera.requestCameraPermissionsAsync() : camera.getCameraPermissionsAsync();
      }
      case "microphone": {
        if (camera === null) return null;
        return prompt
          ? camera.requestMicrophonePermissionsAsync()
          : camera.getMicrophonePermissionsAsync();
      }
      case "location": {
        if (location === null) return null;
        return prompt
          ? location.requestForegroundPermissionsAsync()
          : location.getForegroundPermissionsAsync();
      }
      case "photos": {
        if (mediaLibrary === null) return null;
        return prompt ? mediaLibrary.requestPermissionsAsync() : mediaLibrary.getPermissionsAsync();
      }
    }
  }
}
