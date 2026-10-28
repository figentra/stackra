/**
 * Stackra file contract:
 * Purpose: unit tests of `checkNativeModules`: native source in an app outside `ios/` and `android/` is refused; a
 *          module package missing `plugin/` or its native folders, or not listing them in `files`, is refused; a
 *          complete one passes.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0478; ADR 0022 (test placement).
 */
import { describe, expect, it } from "@stackra/testing";

import { checkNativeModules } from "#node/functions/check-native-modules.function";

const MODULE = [
  "packages/experience/native-x/expo-module.config.json",
  "packages/experience/native-x/src/index.ts",
  "packages/experience/native-x/plugin/index.ts",
  "packages/experience/native-x/ios/X.swift",
  "packages/experience/native-x/android/build.gradle",
];
const FILES = ["dist", "src", "plugin", "ios", "android", "expo-module.config.json"];

describe("checkNativeModules", () => {
  it("accepts a complete module package and an app's generated native folders", () => {
    expect(checkNativeModules([...MODULE, "apps/m/ios/AppDelegate.swift"], () => FILES)).toEqual(
      [],
    );
    expect(
      checkNativeModules(MODULE, () => [
        "src",
        "plugin/src",
        "ios",
        "android/src",
        "expo-module.config.json",
      ]),
    ).toEqual([]);
  });

  it("refuses hand-written native code in an app", () => {
    expect(checkNativeModules(["apps/m/src/native-sources/x/X.kt"], () => undefined)).toHaveLength(
      1,
    );
    // STA-1533 moves the one app surface that predates ADR 0478.
    expect(
      checkNativeModules(["apps/mobile/src/native-sources/customer-display/X.kt"], () => undefined),
    ).toEqual([]);
  });

  it("refuses a module package without its folders or its files entries", () => {
    expect(checkNativeModules(MODULE.slice(0, 3), () => FILES)).toEqual([
      "packages/experience/native-x: an Expo module package has ios/ or android/ in git (ADR 0478)",
    ]);
    expect(checkNativeModules(MODULE, () => ["src"])).toHaveLength(4);
  });
});
