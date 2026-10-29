/**
 * Stackra file contract:
 * Purpose: unit tests of `systemDriverDefaults` and of the wiring it feeds: an Expo-only app takes
 *          `accessibility_info`, `expo` and its own `DevicePermissions` driver (else `memory`); a web app, a mixed app
 *          and a service take `memory`; the phone ports take `expo` with their config classes; a mixed app's native
 *          rows are the native drivers; a package and a host that does not declare the port's package take none; and
 *          `emitWiring` lists the port's table with that `default` and its config row although no constructor injects
 *          it, and a `nativeWiring` for a mixed app.
 * Boundary: test only; asserts on the returned rows and the generated source text.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0263; ADR 0266; STA-1535; STA-1536.
 */
import { describe, expect, it } from "@stackra/testing";

import { emitWiring } from "#core/functions/emit-wiring.function";
import { systemDriverDefaults } from "#core/functions/system-driver-defaults.function";
import type { DeclaredClass } from "#core/types/declared-class.type";
import type { MemberIR } from "#core/types/member-ir.type";
import { COMMERCE_IR } from "#core/__tests__/fixtures/commerce-ir.fixture";
import { LOYALTY_KIT_IR } from "#core/__tests__/fixtures/loyalty-kit-ir.fixture";
import { WEB_APP_IR } from "#core/__tests__/fixtures/web-app-ir.fixture";

const DECLARED = ["@stackra/theming", "@stackra/platform"];

/** The app's own `DevicePermissions` driver, a subclass of the abstract Expo one. */
const APP_PERMISSIONS: DeclaredClass = {
  name: "AppDevicePermissionsDriver",
  kind: "driver",
  module: "web",
  file: "src/drivers/app-device-permissions.driver.ts",
  importPath: "#drivers/app-device-permissions.driver",
  options: {},
  partner: { name: "DevicePermissions", kind: "port", from: "@stackra/platform/contracts" },
  deps: [],
  facets: [],
  methods: [],
  refusals: [],
  statics: {},
  traits: [],
};

/** The pairs of port and driver name of `ir`. */
const pairs = (ir: MemberIR): string[][] =>
  systemDriverDefaults(ir).map(({ port, driver }) => [port.name, driver]);

describe("systemDriverDefaults", () => {
  it("gives an Expo-only app the native drivers and memory permissions without its own driver", () => {
    const ir: MemberIR = { ...WEB_APP_IR, targets: ["ios", "android"], packages: DECLARED };
    expect(pairs(ir)).toEqual([
      ["SystemAccessibility", "accessibility_info"],
      ["SystemSettings", "expo"],
      ["DevicePermissions", "memory"],
      ["AppLock", "expo"],
      ["LiveActivities", "expo"],
      ["AppIcon", "expo"],
    ]);
  });

  it("gives an Expo-only app the phone ports' Expo drivers with their config classes", () => {
    const ir: MemberIR = {
      ...WEB_APP_IR,
      targets: ["ios"],
      packages: [
        ...DECLARED,
        "@stackra/identity",
        "@stackra/native-spotlight",
        "@stackra/native-share",
      ],
    };
    const rows = systemDriverDefaults(ir).map(({ port, driver, config }) => [
      port.name,
      driver,
      config?.name,
    ]);
    for (const row of [
      ["AppLock", "expo", "AppLockConfig"],
      ["Passkeys", "expo", undefined],
      ["LiveActivities", "expo", "LiveActivityConfig"],
      ["DeviceSearchIndex", "expo", "SpotlightConfig"],
      ["IncomingShare", "expo", "NativeShareConfig"],
      ["AppIcon", "expo", "AppIconConfig"],
    ])
      expect(rows).toContainEqual(row);
    expect(systemDriverDefaults(ir).find(({ port }) => port.name === "Passkeys")?.port.from).toBe(
      "@stackra/identity/contracts",
    );
  });

  it("gives a mixed app's native entry the native drivers and its browser entry memory", () => {
    const ir: MemberIR = { ...WEB_APP_IR, targets: ["web", "ios"], packages: DECLARED };
    expect(pairs(ir)).toContainEqual(["AppLock", "memory"]);
    expect(
      systemDriverDefaults(ir, "native").map(({ port, driver }) => [port.name, driver]),
    ).toContainEqual(["AppLock", "expo"]);
    expect(new Set(systemDriverDefaults(ir, "browser").map(({ driver }) => driver))).toEqual(
      new Set(["memory"]),
    );
    // A web-only app has no native runtime, so asking for its native rows still gives memory.
    expect(
      new Set(
        systemDriverDefaults({ ...ir, targets: ["web"] }, "native").map(({ driver }) => driver),
      ),
    ).toEqual(new Set(["memory"]));
  });

  it("gives an Expo-only app its own DevicePermissions driver", () => {
    const ir: MemberIR = {
      ...WEB_APP_IR,
      targets: ["ios"],
      packages: DECLARED,
      classes: [...WEB_APP_IR.classes, APP_PERMISSIONS],
    };
    expect(pairs(ir)).toContainEqual(["DevicePermissions", "app"]);
  });

  it("gives a web app, a mixed app and a service memory everywhere", () => {
    for (const ir of [
      { ...WEB_APP_IR, targets: ["web"], packages: DECLARED },
      { ...WEB_APP_IR, targets: ["web", "ios"], packages: DECLARED },
      { ...COMMERCE_IR, packages: DECLARED },
    ])
      expect(new Set(systemDriverDefaults(ir).map(({ driver }) => driver))).toEqual(
        new Set(["memory"]),
      );
  });

  it("gives a package, and a host without the port's package, none", () => {
    expect(systemDriverDefaults({ ...LOYALTY_KIT_IR, packages: DECLARED })).toEqual([]);
    expect(pairs({ ...WEB_APP_IR, targets: ["ios"], packages: ["@stackra/platform"] })).toEqual([
      ["SystemSettings", "expo"],
      ["DevicePermissions", "memory"],
      ["AppLock", "expo"],
      ["LiveActivities", "expo"],
      ["AppIcon", "expo"],
    ]);
  });
});

describe("emitWiring with a follow-the-system port", () => {
  it("lists the port no constructor injects, defaulting to the driver of the app's runtime", () => {
    const platform: MemberIR["dependencies"][number] = {
      package: "@stackra/platform",
      manifest: {
        member: "platform",
        package: "@stackra/platform",
        version: "0.1.0",
        drivers: [
          {
            port: "SystemSettings",
            key: "platform.SystemSettings",
            candidates: ["expo", "memory"],
            classes: {
              expo: { class: "ExpoSystemSettingsDriver", from: "@stackra/platform/native" },
              memory: { class: "MemorySystemSettingsDriver", from: "@stackra/platform" },
            },
          },
        ],
      },
    };
    const content = emitWiring({
      ...WEB_APP_IR,
      targets: ["ios", "android"],
      dependencies: [...WEB_APP_IR.dependencies, platform],
    });
    for (const line of [
      '      key: "platform.SystemSettings",',
      '      default: "expo",',
      '        "expo": () => import("@stackra/platform/native").then((m) => m.ExpoSystemSettingsDriver),',
    ])
      expect(content).toContain(line);
    expect(content).not.toContain("nativeWiring");
  });

  it("lists a phone port's config row and gives a mixed app a nativeWiring with the Expo driver", () => {
    const platform: MemberIR["dependencies"][number] = {
      package: "@stackra/platform",
      manifest: {
        member: "platform",
        package: "@stackra/platform",
        version: "0.1.0",
        config: [{ key: "app_lock", class: "AppLockConfig", from: "@stackra/platform" }],
        drivers: [
          {
            port: "AppLock",
            key: "platform.AppLock",
            candidates: ["expo", "memory"],
            classes: {
              expo: { class: "ExpoAppLockDriver", from: "@stackra/platform/native" },
              memory: { class: "MemoryAppLockDriver", from: "@stackra/platform" },
            },
          },
        ],
      },
    };
    const content = emitWiring({
      ...WEB_APP_IR,
      targets: ["web", "ios"],
      dependencies: [...WEB_APP_IR.dependencies, platform],
    });
    for (const line of [
      '      key: "platform.AppLock",',
      '      default: "memory",',
      '    { key: "app_lock", provide: AppLockConfig },',
      'import type { Wiring, WiringDriver } from "@stackra/container";',
      '  "platform.AppLock": "expo",',
      "export const nativeWiring = {",
      '    default: NATIVE_DEFAULTS[table.key ?? ""] ?? table.default,',
    ])
      expect(content).toContain(line);
  });
});
