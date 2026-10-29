/**
 * Stackra file contract:
 * Purpose: `emitExpoConfig`, an app's Expo config: `.stackra/app.config.ts` and the root `app.config.ts` shim the Expo
 *          CLI reads. Gen owns the identity (`name`, `slug`, `scheme`, `version`, the bundle id and package), the
 *          per-app languages (expo-localization from `I18nConfig.locales` and `rtl`), the passkey domain
 *          (`webcredentials:<IdentityConfig.issuer host>`), expo-widgets with its app group and Live Activities, the
 *          brand kit's alternate icons (expo-alternate-app-icons), the `@stackra/native-share` and
 *          `@stackra/native-spotlight` plugins and the permission plugins (expo-location when in use only,
 *          expo-media-library, expo-local-authentication) with their text from the `permissions` lang namespace. The
 *          rest of the `expo` section of `defineApp` passes through.
 * Boundary: pure; written only for an app whose `defineApp` lists `ios` or `android`. A plugin is written only when
 *           the app declares its package. Refusals: `expo_owned_key` (the section sets an owned key or plugin),
 *           `expo_identity_missing` (no `ios.bundleId` or `android.package` for a listed target),
 *           `expo_permission_text_missing` (a permission plugin with no text in the base locale) and `app_icon_drift`
 *           (the host's `AppIconConfig.icons` differ from the icon sets under `assets/app-icons/`).
 * Runtime: isomorphic
 * Governing contract: ADR 0295 (decisions 2 to 5); ADR 0250 (decision 2: alternate icons); ADR 0478 (native settings
 *                     through config plugins); ADR 0206 (passkeys at the provider's domain).
 */
import { EXPO_OWNED_KEYS } from "#core/constants/expo-owned-keys.constant";
import { EXPO_OWNED_PLUGINS } from "#core/constants/expo-owned-plugins.constant";
import { generatedHeader } from "#core/functions/generated-header.function";
import type { GenError } from "#core/types/gen-error.type";
import type { GeneratedFile } from "#core/types/generated-file.type";
import type { MemberIR } from "#core/types/member-ir.type";

/** A JSON object. */
type Json = Record<string, unknown>;

/** The base defaults of the config fields read here, used when the host's override does not set one. */
// shortcut: mirrors the defaults of I18nOptions, IdentityOptions and AppIconOptions; read them from each package's
// manifest once it records config defaults.
const DEFAULTS: Readonly<Record<string, unknown>> = {
  "I18nConfig.locales": ["en"],
  "I18nConfig.rtl": ["ar", "ar-SA", "ar-AE", "ar-EG"],
  "IdentityConfig.issuer": "",
  "AppIconConfig.icons": [],
};

/** The lang key (in the `permissions` namespace) each permission plugin option reads. */
const PERMISSION_TEXT: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  "expo-location": { locationWhenInUsePermission: "location" },
  "expo-media-library": { photosPermission: "photos", savePhotosPermission: "save_photos" },
  "expo-local-authentication": { faceIDPermission: "face_id" },
};

/** Whether `value` is a JSON object. */
const isObject = (value: unknown): value is Json =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** The plugin name of a `plugins` entry (`"name"` or `["name", options]`). */
const pluginName = (entry: unknown): unknown => (Array.isArray(entry) ? entry[0] : entry);

/** A refusal about `stackra.config.ts` (or another member file). */
const refusal = (
  code: string,
  subject: string,
  message: string,
  fix: string,
  file = "stackra.config.ts",
): GenError => ({
  code,
  file,
  line: 0,
  column: 0,
  subject,
  message,
  fix,
});

/**
 * The Expo config files of `ir`, or its refusals.
 *
 * @example
 * emitExpoConfig(ir).files.map((file) => file.path); // [".stackra/app.config.ts", "app.config.ts"]
 */
export function emitExpoConfig(ir: MemberIR): {
  readonly files: GeneratedFile[];
  readonly errors: GenError[];
} {
  const targets = ir.targets ?? [];
  const ios = targets.includes("ios");
  const android = targets.includes("android");
  if (ir.app === undefined || (!ios && !android)) return { files: [], errors: [] };
  const { definition, icons } = ir.app;
  const declared = (name: string): boolean => ir.packages?.includes(name) === true;
  // A host override's own default, or the base default when the override does not set it (ADR 0305 rule 1).
  const configured = (base: string, from: string, field: string): unknown =>
    ir.shapes
      .find(
        (shape) =>
          shape.kind === "config" &&
          shape.base?.kind === "package" &&
          shape.base.name === base &&
          (shape.base.from === from || shape.base.from.startsWith(`${from}/`)),
      )
      ?.fields.find((candidate) => candidate.name === field)?.default?.value ??
    DEFAULTS[`${base}.${field}`];
  const errors: GenError[] = [];

  const section = isObject(definition["expo"]) ? definition["expo"] : {};
  for (const key of EXPO_OWNED_KEYS) {
    let value: unknown = section;
    for (const part of key.split(".")) value = isObject(value) ? value[part] : undefined;
    if (value !== undefined)
      errors.push(
        refusal(
          "expo_owned_key",
          `expo.${key}`,
          `the expo section sets \`${key}\`, which gen writes`,
          "remove it: gen derives it from `name`, `scheme`, `ios`, `android`, the package version and the config classes",
        ),
      );
  }
  const ownPlugins = Array.isArray(section["plugins"]) ? section["plugins"] : [];
  for (const entry of ownPlugins) {
    const name = pluginName(entry);
    if (typeof name === "string" && (EXPO_OWNED_PLUGINS as readonly string[]).includes(name))
      errors.push(
        refusal(
          "expo_owned_key",
          `expo.plugins.${name}`,
          `the expo section lists the ${name} plugin, which gen writes`,
          `remove the entry: gen writes ${name} when the app declares the package`,
        ),
      );
  }

  const iosSection = isObject(definition["ios"]) ? definition["ios"] : {};
  const androidSection = isObject(definition["android"]) ? definition["android"] : {};
  const bundleId = typeof iosSection["bundleId"] === "string" ? iosSection["bundleId"] : undefined;
  const androidPackage =
    typeof androidSection["package"] === "string" ? androidSection["package"] : undefined;
  if (ios && bundleId === undefined)
    errors.push(
      refusal(
        "expo_identity_missing",
        "ios.bundleId",
        "the app lists the ios target but defineApp has no `ios.bundleId`",
        'add `ios: { bundleId: "com.acme.app" }` to defineApp',
      ),
    );
  if (android && androidPackage === undefined)
    errors.push(
      refusal(
        "expo_identity_missing",
        "android.package",
        "the app lists the android target but defineApp has no `android.package`",
        'add `android: { package: "com.acme.app" }` to defineApp',
      ),
    );

  // The permission text, from the base locale's `permissions` namespace (ADR 0295 decision 4.5).
  const catalogues = ir.catalogues ?? {};
  // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
  const locales = Object.keys(catalogues).sort();
  const base = locales.includes("en") ? "en" : locales[0];
  const permissions = base === undefined ? undefined : catalogues[base]?.["permissions"];
  const texts = (plugin: string): Json => {
    const out: Json = {};
    for (const [option, key] of Object.entries(PERMISSION_TEXT[plugin] ?? {})) {
      const text = isObject(permissions) ? permissions[key] : undefined;
      if (typeof text === "string" && text !== "") out[option] = text;
      else
        errors.push(
          refusal(
            "expo_permission_text_missing",
            `permissions.${key}`,
            `the ${plugin} plugin needs its \`${option}\` text and the base locale has no \`permissions.${key}\``,
            `add "${key}" to assets/lang/${base ?? "en"}/permissions.json`,
            `assets/lang/${base ?? "en"}/permissions.json`,
          ),
        );
    }
    return out;
  };

  // The icons the build carries: the brand kit's sets, and the same names in the host's AppIconConfig.
  const listed = configured("AppIconConfig", "@stackra/platform", "icons");
  const listedIcons = Array.isArray(listed) ? listed.map(String) : [];
  if (listedIcons.join(",") !== [...icons].join(","))
    errors.push(
      refusal(
        "app_icon_drift",
        "AppIconConfig.icons",
        `AppIconConfig.icons lists [${listedIcons.join(", ")}] and assets/app-icons holds [${icons.join(", ")}]`,
        `set \`override icons = ${JSON.stringify(icons)}\` in the host's AppIconConfig, or add or remove the icon set`,
        "src/config/app-icon.config.ts",
      ),
    );

  const plugins: unknown[] = [...ownPlugins];
  if (declared("expo-localization")) {
    const shipped = configured("I18nConfig", "@stackra/i18n", "locales");
    const rtl = configured("I18nConfig", "@stackra/i18n", "rtl");
    const supported = Array.isArray(shipped) ? shipped.map(String) : [];
    plugins.push([
      "expo-localization",
      {
        supportsRTL: Array.isArray(rtl) && supported.some((locale) => rtl.includes(locale)),
        supportedLocales: { ios: supported, android: supported },
      },
    ]);
  }
  if (declared("expo-location"))
    plugins.push([
      "expo-location",
      {
        ...texts("expo-location"),
        locationAlwaysAndWhenInUsePermission: false,
        locationAlwaysPermission: false,
        isIosBackgroundLocationEnabled: false,
        isAndroidBackgroundLocationEnabled: false,
        motionUsagePermission: false,
      },
    ]);
  if (declared("expo-media-library"))
    plugins.push([
      "expo-media-library",
      { ...texts("expo-media-library"), granularPermissions: ["photo"] },
    ]);
  if (declared("expo-local-authentication"))
    plugins.push(["expo-local-authentication", texts("expo-local-authentication")]);
  const widgets = declared("expo-widgets") && bundleId !== undefined;
  if (widgets) plugins.push(["expo-widgets", { groupIdentifier: `group.${bundleId}` }]);
  if (declared("expo-alternate-app-icons") && icons.length > 0) {
    const adaptive = isObject(section["android"]) ? section["android"]["adaptiveIcon"] : undefined;
    const background =
      isObject(adaptive) && typeof adaptive["backgroundColor"] === "string"
        ? adaptive["backgroundColor"]
        : "#FFFFFF";
    plugins.push([
      "expo-alternate-app-icons",
      icons.map((name) => ({
        name,
        ios: `./assets/app-icons/${name}/app-icon-ios-1024.png`,
        android: {
          foregroundImage: `./assets/app-icons/${name}/app-icon-android-foreground-1024.png`,
          backgroundColor: background,
        },
      })),
    ]);
  }
  for (const name of ["@stackra/native-share", "@stackra/native-spotlight"])
    if (declared(name)) plugins.push(name);
  if (errors.length > 0) return { files: [], errors };

  const issuer = configured("IdentityConfig", "@stackra/identity", "issuer");
  // The host of an https issuer; gen reads the default before the schema runs, so a malformed one gives no domain.
  const host = typeof issuer === "string" ? /^https:\/\/([^/?#:]+)/.exec(issuer)?.[1] : undefined;
  const ownIos = isObject(section["ios"]) ? section["ios"] : {};
  const infoPlist = {
    ...(isObject(ownIos["infoPlist"]) ? ownIos["infoPlist"] : {}),
    ...(widgets ? { NSSupportsLiveActivities: true } : {}),
  };
  const name = typeof definition["name"] === "string" ? definition["name"] : ir.package;
  const scheme = typeof definition["scheme"] === "string" ? definition["scheme"] : undefined;
  const config: Json = {
    name,
    slug: scheme ?? ir.member.replaceAll("_", "-"),
    ...(scheme !== undefined ? { scheme } : {}),
    version: ir.version,
    ...section,
    ...(ios
      ? {
          ios: {
            ...ownIos,
            bundleIdentifier: bundleId,
            ...(typeof iosSection["supportsTablet"] === "boolean"
              ? { supportsTablet: iosSection["supportsTablet"] }
              : {}),
            ...(host !== undefined && declared("@stackra/identity")
              ? { associatedDomains: [`webcredentials:${host}`] }
              : {}),
            ...(Object.keys(infoPlist).length > 0 ? { infoPlist } : {}),
          },
        }
      : {}),
    ...(android
      ? {
          android: {
            ...(isObject(section["android"]) ? section["android"] : {}),
            package: androidPackage,
          },
        }
      : {}),
    plugins,
  };

  const generated = [
    generatedHeader({
      from: "stackra.config.ts, the config classes, assets/lang and assets/app-icons",
      purpose: `the Expo config of ${ir.package}: identity, languages, passkey domain, widgets, icons and permissions.`,
      boundary:
        "read by the Expo CLI through the root app.config.ts shim; change stackra.config.ts, never this file.",
      runtime: "node",
    }),
    `export default ${JSON.stringify(config, undefined, 2)};`,
    "",
  ].join("\n");
  const shim = [
    generatedHeader({
      from: ".stackra/app.config.ts",
      purpose: `the root shim of ${ir.package}'s Expo config: the Expo CLI reads only the member root.`,
      boundary: "a re-export only, gitignored.",
      runtime: "node",
    }),
    'export { default } from "./.stackra/app.config";',
    "",
  ].join("\n");
  return {
    files: [
      { path: ".stackra/app.config.ts", content: generated },
      { path: "app.config.ts", content: shim },
    ],
    errors: [],
  };
}
