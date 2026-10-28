/**
 * Stackra file contract:
 * Purpose: proves `applyIosInfoPlist` adds the usage strings (the app's own first, then the option, then the default)
 *          and the `bluetooth-central` mode once, without touching the plist passed in.
 * Boundary: test only; no Expo.
 * Runtime: node (vitest)
 * Governing contract: ADR 0479 (decision 6); ADR 0022 (test placement).
 */
import { describe, expect, it } from "@stackra/testing";

import { applyIosInfoPlist } from "#plugin/functions/apply-ios-info-plist.function";

describe("applyIosInfoPlist", () => {
  it("adds the defaults and the background mode to an empty plist", () => {
    expect(applyIosInfoPlist({}, {})).toEqual({
      NSBluetoothAlwaysUsageDescription: "This app uses Bluetooth to connect to card readers.",
      NSLocationWhenInUseUsageDescription:
        "This app uses your location to confirm where card payments are taken.",
      UIBackgroundModes: ["bluetooth-central"],
    });
  });

  it("keeps the app's own strings and modes and takes the options over the defaults", () => {
    const plist = {
      NSBluetoothAlwaysUsageDescription: "Own Bluetooth text",
      UIBackgroundModes: ["remote-notification", "bluetooth-central"],
    };
    const next = applyIosInfoPlist(plist, { bluetoothUsage: "Option", locationUsage: "Where" });
    expect(next).toEqual({
      NSBluetoothAlwaysUsageDescription: "Own Bluetooth text",
      NSLocationWhenInUseUsageDescription: "Where",
      UIBackgroundModes: ["remote-notification", "bluetooth-central"],
    });
    expect(plist.UIBackgroundModes).toEqual(["remote-notification", "bluetooth-central"]);
  });
});
