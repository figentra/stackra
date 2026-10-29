/**
 * Stackra file contract:
 * Purpose: unit tests of `expoConfigOf`: the runway identity, tablet, links, EAS project and template line land in the
 *          template's base config; a disabled capability's base plugin, Info.plist key and entitlement are removed and
 *          its permission blocked, and the enabled flags land in `extra.capabilities`; a white-label variant's identity
 *          replaces the entry's key by key; an app offering Apple gets the Sign in with Apple entitlement and one
 *          without it does not.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0439 (decisions 2, 3, 6 and 8); STA-1578.
 */
import { describe, expect, it } from "@stackra/testing";

import { expoConfigOf } from "#node/functions/expo-config-of.function";
import type { MobileApp } from "#node/types/mobile-app.type";
import type { MobileCapabilityConfig } from "#node/types/mobile-capability-config.type";

const BASE = {
  name: "Template",
  slug: "template",
  version: "1.0.0",
  plugins: ["expo-router", "expo-camera"],
  ios: {
    infoPlist: { NSCameraUsageDescription: "Scan codes", ITSAppUsesNonExemptEncryption: false },
    entitlements: { "aps-environment": "production" },
  },
  android: { blockedPermissions: ["android.permission.RECORD_AUDIO"] },
  extra: { router: {} },
};

const ENTRY: MobileApp = {
  template: "os/mobile@3",
  identity: {
    name: { en: "Mezzora Staff", ar: "ميزورا" },
    ios: { bundleId: "com.figentra.mezzora.staff" },
    android: { package: "com.figentra.mezzora.staff" },
    scheme: "mezzora-staff",
    links: ["console.mezzora.figentra.com"],
  },
  capabilities: ["push"],
  tablet: true,
  eas: { project: "0f8c2b1e-5d3a-4c7b-9e21-6a4d8f0b3c57", channel: "production" },
};

const CAPABILITIES: MobileCapabilityConfig = {
  plugins: ["expo-notifications"],
  removedPlugins: ["expo-camera"],
  excludedModules: ["expo-camera"],
  removedInfoPlist: ["NSCameraUsageDescription"],
  removedEntitlements: [],
  blockedPermissions: ["android.permission.CAMERA"],
};

/** The `ios` block of `entry`'s config. */
function iosOf(entry: MobileApp): Record<string, unknown> {
  return expoConfigOf(BASE, {
    project: "mezzora",
    app: "staff",
    entry,
    capabilities: CAPABILITIES,
  })["ios"] as Record<string, unknown>;
}

describe("expoConfigOf", () => {
  it("writes the runway identity and strips the disabled capabilities", () => {
    const config = expoConfigOf(BASE, {
      project: "mezzora",
      app: "staff",
      entry: ENTRY,
      capabilities: CAPABILITIES,
    });
    expect(config).toEqual({
      name: "Mezzora Staff",
      slug: "mezzora-staff",
      version: "1.0.0",
      scheme: "mezzora-staff",
      runtimeVersion: "os-mobile-3",
      updates: { url: "https://u.expo.dev/0f8c2b1e-5d3a-4c7b-9e21-6a4d8f0b3c57" },
      plugins: ["expo-router", "expo-notifications"],
      ios: {
        bundleIdentifier: "com.figentra.mezzora.staff",
        supportsTablet: true,
        associatedDomains: ["applinks:console.mezzora.figentra.com"],
        infoPlist: { ITSAppUsesNonExemptEncryption: false },
        entitlements: { "aps-environment": "production" },
      },
      android: {
        package: "com.figentra.mezzora.staff",
        blockedPermissions: ["android.permission.RECORD_AUDIO", "android.permission.CAMERA"],
        intentFilters: [
          {
            action: "VIEW",
            autoVerify: true,
            data: [{ scheme: "https", host: "console.mezzora.figentra.com" }],
            category: ["BROWSABLE", "DEFAULT"],
          },
        ],
      },
      extra: {
        router: {},
        eas: { projectId: "0f8c2b1e-5d3a-4c7b-9e21-6a4d8f0b3c57" },
        capabilities: ["push"],
      },
    });
  });

  it("takes a white-label variant's identity over the entry's", () => {
    const config = expoConfigOf(BASE, {
      project: "commerce",
      app: "shopper",
      entry: ENTRY,
      capabilities: CAPABILITIES,
      variant: {
        scope: "scope_123",
        identity: { name: { en: "Acme Shop" }, ios: { bundleId: "com.acme.shop" } },
      },
    });
    expect(config["name"]).toBe("Acme Shop");
    expect(config["slug"]).toBe("commerce-shopper");
    expect((config["ios"] as Record<string, unknown>)["bundleIdentifier"]).toBe("com.acme.shop");
    expect((config["android"] as Record<string, unknown>)["package"]).toBe(
      "com.figentra.mezzora.staff",
    );
  });

  it("adds the Sign in with Apple entitlement only when the app offers Apple", () => {
    expect(iosOf({ ...ENTRY, signIn: { social: ["google", "apple"] } })).toMatchObject({
      usesAppleSignIn: true,
      entitlements: {
        "aps-environment": "production",
        "com.apple.developer.applesignin": ["Default"],
      },
    });
    expect(iosOf({ ...ENTRY, signIn: { social: [] } })).not.toHaveProperty("usesAppleSignIn");
    expect(iosOf(ENTRY)["entitlements"]).toEqual({ "aps-environment": "production" });
  });
});
