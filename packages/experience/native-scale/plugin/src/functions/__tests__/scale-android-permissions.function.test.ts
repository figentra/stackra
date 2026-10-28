/**
 * Stackra file contract:
 * Purpose: proves `scaleAndroidPermissions` adds the Bluetooth permissions (legacy ones capped at SDK 30) for `ble`
 *          or `spp`, and none for `usb` alone.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0478 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { scaleAndroidPermissions } from "../scale-android-permissions.function";

describe("scaleAndroidPermissions", () => {
  it("adds the Bluetooth permissions for ble or spp", () => {
    const permissions = scaleAndroidPermissions(["spp"]);
    expect(permissions.map((permission) => permission.name)).toEqual([
      "android.permission.BLUETOOTH_CONNECT",
      "android.permission.BLUETOOTH_SCAN",
      "android.permission.BLUETOOTH",
      "android.permission.BLUETOOTH_ADMIN",
      "android.permission.ACCESS_FINE_LOCATION",
    ]);
    expect(permissions.filter((permission) => permission.maxSdkVersion === 30)).toHaveLength(3);
    expect(scaleAndroidPermissions(["ble", "usb"])).toEqual(permissions);
  });

  it("adds none for usb alone", () => {
    expect(scaleAndroidPermissions(["usb"])).toEqual([]);
  });
});
