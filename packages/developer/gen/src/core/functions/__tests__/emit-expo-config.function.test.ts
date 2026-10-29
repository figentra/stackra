/**
 * Stackra file contract:
 * Purpose: unit tests of `emitExpoConfig`: nothing for a web-only app or one without `defineApp` data; the owned
 *          identity, languages, passkey domain, widgets, icons, share, spotlight and permission plugins written after
 *          the section's own plugins; and the refusals `expo_owned_key`, `expo_identity_missing`,
 *          `expo_permission_text_missing` and `app_icon_drift`.
 * Boundary: test only; builds on `WEB_APP_IR` and evaluates the generated object literal.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0295 (decisions 3 to 5); ADR 0250 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { WEB_APP_IR } from "#core/__tests__/fixtures/web-app-ir.fixture";
import { emitExpoConfig } from "#core/functions/emit-expo-config.function";
import type { MemberIR } from "#core/types/member-ir.type";
import type { ShapeIR } from "#core/types/shape-ir.type";

/** A host override of `base` from `from` setting `field` to `value`. */
const override = (base: string, from: string, field: string, value: unknown): ShapeIR => ({
  name: base,
  kind: "config",
  module: "mobile",
  file: `src/config/${base}.ts`,
  importPath: `#config/${base}`,
  base: { kind: "package", name: base, from },
  fields: [
    {
      name: field,
      optional: false,
      nullable: false,
      type: { kind: "json" },
      rules: [],
      default: { value, code: JSON.stringify(value), imports: [] },
    },
  ],
  relations: [],
});

/** The mobile app, read. */
const MOBILE: MemberIR = {
  ...WEB_APP_IR,
  member: "mobile",
  package: "@acme/mobile",
  version: "1.2.0",
  targets: ["ios", "android"],
  packages: [
    "@stackra/identity",
    "@stackra/native-share",
    "@stackra/native-spotlight",
    "expo-alternate-app-icons",
    "expo-local-authentication",
    "expo-localization",
    "expo-location",
    "expo-media-library",
    "expo-widgets",
  ],
  shapes: [
    override("I18nConfig", "@stackra/i18n", "locales", ["en", "ar"]),
    override("IdentityConfig", "@stackra/identity", "issuer", "https://auth.acme.com/"),
    override("AppIconConfig", "@stackra/platform", "icons", ["Ramadan"]),
  ],
  catalogues: {
    en: {
      permissions: {
        location: "Acme uses your location while you use the app.",
        photos: "Acme reads the photos you choose.",
        save_photos: "Acme saves images when you ask.",
        face_id: "Acme uses Face ID to unlock.",
      },
    },
  },
  app: {
    definition: {
      name: "Acme",
      scheme: "acme",
      ios: { bundleId: "com.acme.app", supportsTablet: true },
      android: { package: "com.acme.app" },
      expo: {
        orientation: "default",
        ios: { config: { usesNonExemptEncryption: false } },
        android: { adaptiveIcon: { backgroundColor: "#000000" } },
        plugins: ["react-native-bottom-tabs"],
      },
    },
    icons: ["Ramadan"],
  },
};

/** The generated config object of `ir`. */
function configOf(ir: MemberIR): Record<string, unknown> {
  const file = emitExpoConfig(ir).files.find(
    (candidate) => candidate.path === ".stackra/app.config.ts",
  );
  const literal = /export default ([\s\S]*);\n$/.exec(file?.content ?? "")?.[1] ?? "null";
  return JSON.parse(literal) as Record<string, unknown>;
}

describe("emitExpoConfig", () => {
  it("writes nothing for a web app or an app without defineApp data", () => {
    expect(emitExpoConfig({ ...MOBILE, targets: ["web"] })).toEqual({ files: [], errors: [] });
    const { app: _app, ...bare } = MOBILE;
    expect(emitExpoConfig(bare)).toEqual({ files: [], errors: [] });
  });

  it("writes the config and the root shim", () => {
    const { files, errors } = emitExpoConfig(MOBILE);
    expect(errors).toEqual([]);
    expect(files.map((file) => file.path)).toEqual([".stackra/app.config.ts", "app.config.ts"]);
    expect(files[1]?.content).toContain('export { default } from "./.stackra/app.config";');
    const config = configOf(MOBILE);
    expect(config).toMatchObject({
      name: "Acme",
      slug: "acme",
      scheme: "acme",
      version: "1.2.0",
      orientation: "default",
      ios: {
        config: { usesNonExemptEncryption: false },
        bundleIdentifier: "com.acme.app",
        supportsTablet: true,
        associatedDomains: ["webcredentials:auth.acme.com"],
        infoPlist: { NSSupportsLiveActivities: true },
      },
      android: { adaptiveIcon: { backgroundColor: "#000000" }, package: "com.acme.app" },
    });
    expect(config["plugins"]).toEqual([
      "react-native-bottom-tabs",
      [
        "expo-localization",
        { supportsRTL: true, supportedLocales: { ios: ["en", "ar"], android: ["en", "ar"] } },
      ],
      [
        "expo-location",
        {
          locationWhenInUsePermission: "Acme uses your location while you use the app.",
          locationAlwaysAndWhenInUsePermission: false,
          locationAlwaysPermission: false,
          isIosBackgroundLocationEnabled: false,
          isAndroidBackgroundLocationEnabled: false,
          motionUsagePermission: false,
        },
      ],
      [
        "expo-media-library",
        {
          photosPermission: "Acme reads the photos you choose.",
          savePhotosPermission: "Acme saves images when you ask.",
          granularPermissions: ["photo"],
        },
      ],
      ["expo-local-authentication", { faceIDPermission: "Acme uses Face ID to unlock." }],
      ["expo-widgets", { groupIdentifier: "group.com.acme.app" }],
      [
        "expo-alternate-app-icons",
        [
          {
            name: "Ramadan",
            ios: "./assets/app-icons/Ramadan/app-icon-ios-1024.png",
            android: {
              foregroundImage: "./assets/app-icons/Ramadan/app-icon-android-foreground-1024.png",
              backgroundColor: "#000000",
            },
          },
        ],
      ],
      "@stackra/native-share",
      "@stackra/native-spotlight",
    ]);
  });

  it("writes only the plugins of declared packages, and English-only without RTL", () => {
    const config = configOf({
      ...MOBILE,
      packages: ["expo-localization"],
      shapes: [],
      app: { definition: MOBILE.app?.definition ?? {}, icons: [] },
    });
    expect(config["plugins"]).toEqual([
      "react-native-bottom-tabs",
      [
        "expo-localization",
        { supportsRTL: false, supportedLocales: { ios: ["en"], android: ["en"] } },
      ],
    ]);
    expect((config["ios"] as Record<string, unknown>)["associatedDomains"]).toBeUndefined();
  });

  it("refuses an owned key, a missing identity, missing permission text and icon drift", () => {
    const { files, errors } = emitExpoConfig({
      ...MOBILE,
      catalogues: { en: { permissions: { photos: "x", save_photos: "y", face_id: "z" } } },
      shapes: [],
      app: {
        definition: {
          android: { package: "com.acme.app" },
          expo: { slug: "acme", plugins: [["expo-location", {}]] },
        },
        icons: ["Ramadan"],
      },
    });
    expect(files).toEqual([]);
    expect(errors.map((error) => [error.code, error.subject])).toEqual([
      ["expo_owned_key", "expo.slug"],
      ["expo_owned_key", "expo.plugins.expo-location"],
      ["expo_identity_missing", "ios.bundleId"],
      ["app_icon_drift", "AppIconConfig.icons"],
      ["expo_permission_text_missing", "permissions.location"],
    ]);
  });
});
