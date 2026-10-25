/**
 * Stackra file contract:
 * Purpose: unit and type tests of `DesktopConfig`: a configuration keyed `platform.desktop`, built with its defaults,
 *          the template console's override (hybrid mode, a launcher overlay, menus, tray, deep links, updates,
 *          devices, permissions, hardening) with each nested object spreading the base, and refused bad values.
 * Boundary: test only; the override is the template's `apps/console/src/config/desktop.config.ts` with the
 *           translation keys written out.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decisions 19 and 20); ADR 0281; ADR 0251; ADR 0254.
 */
import { buildConfig, Config, ConfigInvalidError, configKey } from "@stackra/config";
import { Duration } from "@stackra/contracts";
import { OfflineStore } from "@stackra/storage";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { DesktopConfig as BaseDesktopConfig } from "#config/desktop.config";
import { DESKTOP_CONFIG_SCHEMA } from "#core/constants/desktop-config-schema.constant";
import { DesktopMode } from "#core/enums/desktop-mode.enum";
import { InstallMoment } from "#core/enums/install-moment.enum";
import { OverlayAnchor } from "#core/enums/overlay-anchor.enum";
import { OverlayStyle } from "#core/enums/overlay-style.enum";
import { TrayClickAction } from "#core/enums/tray-click-action.enum";
import { WindowKind } from "#core/enums/window-kind.enum";

/** The template's override: the base's name, the package class aliased. */
class DesktopConfig extends BaseDesktopConfig {
  override mode: DesktopMode = DesktopMode.Hybrid;

  override windows: BaseDesktopConfig["windows"] = {
    main: {
      route: "/",
      width: 1280,
      height: 800,
      minWidth: 960,
      minHeight: 640,
      resizable: true,
      persistBounds: true,
      titleBarStyle: "hiddenInset",
      kind: WindowKind.Normal,
      openOnLaunch: true,
    },
  };

  override overlays: BaseDesktopConfig["overlays"] = {
    quick: {
      style: OverlayStyle.Launcher,
      route: "/quick-order",
      shortcut: "CommandOrControl+Shift+Space",
      userConfigurable: true,
      anchor: OverlayAnchor.ScreenCenter,
      alwaysOnTop: true,
      hideOnBlur: true,
      pinnable: false,
      resizable: false,
      vibrancy: true,
      displays: "active",
    },
  };

  override menus: BaseDesktopConfig["menus"] = {
    ...(this as BaseDesktopConfig).menus,
    standardRoles: ["appMenu", "editMenu", "quit"],
    docsUrl: "https://docs.acme.example/console",
  };

  override tray: BaseDesktopConfig["tray"] = {
    ...(this as BaseDesktopConfig).tray,
    enabled: true,
    onClick: TrayClickAction.ToggleMain,
    badge: true,
  };

  override deepLinks: BaseDesktopConfig["deepLinks"] = {
    ...(this as BaseDesktopConfig).deepLinks,
    scheme: "acme-console",
  };

  override updates: BaseDesktopConfig["updates"] = {
    ...(this as BaseDesktopConfig).updates,
    enabled: true,
    channels: ["beta", "latest"],
    checkEvery: Duration.hours(4),
    installOn: InstallMoment.Quit,
    stagingPercentage: 20,
    userSelectableChannel: true,
  };

  override devices: BaseDesktopConfig["devices"] = {
    camera: { reason: "devices::camera.reason" },
    usb: { reason: "devices::usb.reason" },
  };

  override permissions: BaseDesktopConfig["permissions"] = {
    ...(this as BaseDesktopConfig).permissions,
    allow: ["notifications", "media"],
    mediaTypes: ["video", "audio"],
    devices: ["usb", "hid"],
  };

  override hardening: BaseDesktopConfig["hardening"] = {
    ...(this as BaseDesktopConfig).hardening,
    pinnedSpki: [],
  };

  override crashReporter = true;

  override offlineStore: OfflineStore = OfflineStore.EncryptedIndexedDb;
}

describe("DesktopConfig", () => {
  it("is a configuration keyed platform.desktop, an override inheriting the key", () => {
    expect(new BaseDesktopConfig()).toBeInstanceOf(Config);
    expect(configKey(BaseDesktopConfig, "platform")).toBe("platform.desktop");
    expect(configKey(DesktopConfig, "platform")).toBe("platform.desktop");
  });

  it("types its fields on the class and builds with the defaults", () => {
    const config = buildConfig(BaseDesktopConfig);
    expectTypeOf(config.mode).toEqualTypeOf<DesktopMode>();
    expectTypeOf(config.deepLinks.scheme).toEqualTypeOf<string | null>();
    expect({ ...config }).toEqual(DESKTOP_CONFIG_SCHEMA.parse({}));
    expect(config.windows.main?.route).toBe("/");
    expect(Object.isFrozen(config)).toBe(true);
  });

  it("applies the template's override, each nested object over the base", () => {
    const config = buildConfig(DesktopConfig);
    expect(config.mode).toBe("hybrid");
    expect(config.overlays.quick?.style).toBe("launcher");
    expect(config.menus).toEqual({
      applicationMenu: true,
      contextMenu: true,
      standardRoles: ["appMenu", "editMenu", "quit"],
      docsUrl: "https://docs.acme.example/console",
    });
    expect(config.tray.keepAliveDefault).toBe(false);
    expect(config.deepLinks).toEqual({
      scheme: "acme-console",
      claimHttpsOrigin: false,
      route: "/open?url=%s",
    });
    expect(config.updates.checkEvery).toBe(Duration.hours(4));
    expect(config.permissions.allowedNavigationOrigins).toEqual(["app://bundle"]);
    expect(config.devices).toEqual({
      camera: { reason: "devices::camera.reason" },
      usb: { reason: "devices::usb.reason" },
    });
  });

  it("refuses a window set without main and a malformed duration", () => {
    expect(() => buildConfig(BaseDesktopConfig, { values: { windows: {} } })).toThrow(
      ConfigInvalidError,
    );
    expect(() =>
      buildConfig(BaseDesktopConfig, {
        values: {
          updates: {
            ...DESKTOP_CONFIG_SCHEMA.shape.updates.parse(undefined),
            checkEvery: "4 hours" as Duration,
          },
        },
      }),
    ).toThrow(ConfigInvalidError);
  });
});
