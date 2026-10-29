/**
 * Stackra file contract:
 * Purpose: unit tests of `capabilityConfig`: the enabled flags' plugins run once each; the disabled flags' plugins,
 *          modules, Info.plist keys, entitlements and Android permissions are stripped, except what an enabled flag
 *          also declares; the advertising id is blocked unless an enabled flag lists it; a flag the template line does
 *          not offer is refused with its runway path.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0439 (decision 3 and enforcement).
 */
import { describe, expect, it } from "@stackra/testing";

import { RunwayInvalidError } from "#core/errors/runway-invalid.error";
import { AD_ID_PERMISSION } from "#node/constants/ad-id-permission.constant";
import { capabilityConfig } from "#node/functions/capability-config.function";
import type { MobileCapability } from "#node/types/mobile-capability.type";

const CATALOGUE: Record<string, MobileCapability> = {
  scanner: {
    modules: ["expo-camera"],
    plugins: [["expo-camera", { recordAudioAndroid: false }]],
    ios: { infoPlist: ["NSCameraUsageDescription"] },
    android: { permissions: ["android.permission.CAMERA"] },
  },
  push: {
    modules: ["expo-notifications"],
    plugins: ["expo-notifications"],
    ios: { entitlements: ["aps-environment"] },
    android: { permissions: ["android.permission.POST_NOTIFICATIONS"] },
  },
  photos: {
    modules: ["expo-image-picker", "expo-camera"],
    plugins: ["expo-image-picker", ["expo-camera", {}]],
    ios: { infoPlist: ["NSPhotoLibraryUsageDescription", "NSCameraUsageDescription"] },
    android: { permissions: ["android.permission.CAMERA"] },
  },
};

describe("capabilityConfig", () => {
  it("keeps the enabled flags and strips every other flag's declarations", () => {
    expect(capabilityConfig(CATALOGUE, ["push"])).toEqual({
      plugins: ["expo-notifications"],
      removedPlugins: ["expo-camera", "expo-image-picker"],
      excludedModules: ["expo-camera", "expo-image-picker"],
      removedInfoPlist: ["NSCameraUsageDescription", "NSPhotoLibraryUsageDescription"],
      removedEntitlements: [],
      blockedPermissions: ["android.permission.CAMERA", AD_ID_PERMISSION],
    });
  });

  it("never strips what an enabled flag also declares, and runs a shared plugin once", () => {
    const config = capabilityConfig(CATALOGUE, ["scanner", "photos"]);
    expect(config.plugins).toEqual([
      ["expo-camera", { recordAudioAndroid: false }],
      "expo-image-picker",
    ]);
    expect(config.excludedModules).toEqual(["expo-notifications"]);
    expect(config.removedInfoPlist).toEqual([]);
    expect(config.removedEntitlements).toEqual(["aps-environment"]);
    expect(config.blockedPermissions).toEqual([
      "android.permission.POST_NOTIFICATIONS",
      AD_ID_PERMISSION,
    ]);
  });

  it("strips everything when no flag is listed", () => {
    expect(capabilityConfig(CATALOGUE, []).plugins).toEqual([]);
    expect(capabilityConfig(CATALOGUE, []).blockedPermissions).toEqual([
      "android.permission.CAMERA",
      "android.permission.POST_NOTIFICATIONS",
      AD_ID_PERMISSION,
    ]);
  });

  it("blocks the advertising id unless an enabled flag lists it", () => {
    const catalogue: Record<string, MobileCapability> = {
      ...CATALOGUE,
      attribution: { android: { permissions: [AD_ID_PERMISSION] } },
    };
    expect(capabilityConfig(catalogue, ["push"]).blockedPermissions).toContain(AD_ID_PERMISSION);
    expect(capabilityConfig(catalogue, ["push", "attribution"]).blockedPermissions).not.toContain(
      AD_ID_PERMISSION,
    );
  });

  it("refuses a flag the template line does not offer", () => {
    try {
      capabilityConfig(CATALOGUE, ["push", "nfc"], "mobile.staff.capabilities");
      throw new Error("expected a refusal");
    } catch (error) {
      expect(error).toBeInstanceOf(RunwayInvalidError);
      expect((error as RunwayInvalidError).issues).toEqual([
        {
          path: "mobile.staff.capabilities.1",
          message: "The template line offers no capability nfc",
        },
      ]);
    }
  });
});
