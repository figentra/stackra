/**
 * Stackra file contract:
 * Purpose: `scaleAndroidPermissions`, the Android permissions the kept transports need: `BLUETOOTH_CONNECT` and
 *          `BLUETOOTH_SCAN` (Android 12 and later) plus the legacy `BLUETOOTH`, `BLUETOOTH_ADMIN` and
 *          `ACCESS_FINE_LOCATION` up to Android 11 for `ble` and `spp`; nothing for `usb`, whose permission is the
 *          per-device grant the module asks for at connect.
 * Boundary: pure; the plugin writes the answer into the manifest. Each permission once.
 * Runtime: node
 * Governing contract: ADR 0478 (decision 2).
 */
import type { AndroidPermission } from "../types/android-permission.type";

/**
 * The permissions, in manifest order.
 *
 * @example
 * scaleAndroidPermissions(["usb"]); // []
 */
export function scaleAndroidPermissions(
  transports: readonly ("ble" | "spp" | "usb")[],
): AndroidPermission[] {
  if (!transports.includes("ble") && !transports.includes("spp")) return [];
  return [
    { name: "android.permission.BLUETOOTH_CONNECT" },
    { name: "android.permission.BLUETOOTH_SCAN" },
    { name: "android.permission.BLUETOOTH", maxSdkVersion: 30 },
    { name: "android.permission.BLUETOOTH_ADMIN", maxSdkVersion: 30 },
    { name: "android.permission.ACCESS_FINE_LOCATION", maxSdkVersion: 30 },
  ];
}
