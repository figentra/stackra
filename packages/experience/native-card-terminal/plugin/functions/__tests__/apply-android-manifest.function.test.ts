/**
 * Stackra file contract:
 * Purpose: proves `applyAndroidManifest` declares the Bluetooth, location and NFC permissions once (legacy Bluetooth
 *          capped at SDK 30), keeps what the app already declares, and adds NFC and Bluetooth LE as not required.
 * Boundary: test only; no Expo.
 * Runtime: node (vitest)
 * Governing contract: ADR 0479 (decision 6); ADR 0022 (test placement).
 */
import { describe, expect, it } from "@stackra/testing";

import { applyAndroidManifest } from "#plugin/functions/apply-android-manifest.function";
import type { AndroidManifestShape } from "#plugin/types/android-manifest-shape.type";

describe("applyAndroidManifest", () => {
  it("adds every permission and feature to a bare manifest", () => {
    const manifest: AndroidManifestShape = { manifest: {} };
    applyAndroidManifest(manifest);
    expect(manifest.manifest["uses-permission"]).toEqual([
      { $: { "android:name": "android.permission.BLUETOOTH", "android:maxSdkVersion": "30" } },
      {
        $: { "android:name": "android.permission.BLUETOOTH_ADMIN", "android:maxSdkVersion": "30" },
      },
      { $: { "android:name": "android.permission.BLUETOOTH_SCAN" } },
      { $: { "android:name": "android.permission.BLUETOOTH_CONNECT" } },
      { $: { "android:name": "android.permission.ACCESS_COARSE_LOCATION" } },
      { $: { "android:name": "android.permission.ACCESS_FINE_LOCATION" } },
      { $: { "android:name": "android.permission.NFC" } },
    ]);
    expect(manifest.manifest["uses-feature"]).toEqual([
      { $: { "android:name": "android.hardware.nfc", "android:required": "false" } },
      { $: { "android:name": "android.hardware.bluetooth_le", "android:required": "false" } },
    ]);
  });

  it("keeps the app's own elements and adds nothing twice", () => {
    const own = { $: { "android:name": "android.permission.NFC" } };
    const manifest: AndroidManifestShape = { manifest: { "uses-permission": [own] } };
    applyAndroidManifest(manifest);
    applyAndroidManifest(manifest);
    const names = (manifest.manifest["uses-permission"] ?? []).map(
      (element) => element.$["android:name"],
    );
    expect(names.filter((name) => name === "android.permission.NFC")).toHaveLength(1);
    expect(names).toHaveLength(7);
    expect(manifest.manifest["uses-permission"]?.[0]).toBe(own);
    expect(manifest.manifest["uses-feature"]).toHaveLength(2);
  });
});
