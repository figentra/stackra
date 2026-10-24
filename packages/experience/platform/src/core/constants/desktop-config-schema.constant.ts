/**
 * Stackra file contract:
 * Purpose: `DESKTOP_CONFIG_SCHEMA`, the zod schema this package ships for `DesktopConfig` (exported as
 *          `DesktopConfig$`): desktop mode, windows, overlays, menus, tray, deep links, auto-update, devices, renderer
 *          permissions, the tighten-only hardening knobs, launch at login, crash reports and the offline store.
 * Boundary: the stand-in for what gen writes for this package. Every top-level field has a default, so `.parse({})`
 *           gives the full defaults and a host's generated `DesktopConfig$` extends it with
 *           `Base$.shape.<field>.unwrap().default(...)`; a nested object is replaced whole, so its fields have no
 *           defaults of their own. The defaults equal `DesktopOptions`' initializers (tested). The hardening baseline
 *           of ADR 0251 applies whatever these say.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); ADR 0281; ADR 0251 (decision 3); ADR
 *                     0254.
 */
import { Duration, Enum } from "@stackra/contracts";
import { OfflineStore } from "@stackra/storage";
import { z } from "zod";

import { DURATION_SCHEMA } from "#core/constants/duration-schema.constant";
import { DesktopMode } from "#core/enums/desktop-mode.enum";
import { InstallMoment } from "#core/enums/install-moment.enum";
import { OverlayAnchor } from "#core/enums/overlay-anchor.enum";
import { OverlayStyle } from "#core/enums/overlay-style.enum";
import { TrayClickAction } from "#core/enums/tray-click-action.enum";
import { WindowKind } from "#core/enums/window-kind.enum";

/** A route path inside the app. */
const ROUTE = z.string().startsWith("/");

/** One device's entry: the translation key of the reason the OS shows. */
const DEVICE = z.object({ reason: z.string().min(1) }).exactOptional();

// shortcut: authored until gen compiles this package's DesktopOptions into #stackra/schemas; replace with STA-339.
/** The shipped `DesktopConfig$`. */
export const DESKTOP_CONFIG_SCHEMA = z.object({
  mode: z.enum(Enum.values(DesktopMode)).default(DesktopMode.Window),
  windows: z
    .record(
      z.string(),
      z.object({
        route: ROUTE,
        width: z.int().positive(),
        height: z.int().positive(),
        minWidth: z.int().positive(),
        minHeight: z.int().positive(),
        resizable: z.boolean(),
        persistBounds: z.boolean(),
        titleBarStyle: z.enum(["default", "hidden", "hiddenInset", "customButtonsOnHover"]),
        kind: z.enum(Enum.values(WindowKind)),
        openOnLaunch: z.boolean(),
      }),
    )
    .refine((windows) => "main" in windows, { message: "windows needs a main window" })
    .default(() => ({
      main: {
        route: "/",
        width: 1280,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        resizable: true,
        persistBounds: true,
        titleBarStyle: "default" as const,
        kind: WindowKind.Normal,
        openOnLaunch: true,
      },
    })),
  overlays: z
    .record(
      z.string(),
      z.object({
        style: z.enum(Enum.values(OverlayStyle)),
        route: ROUTE,
        shortcut: z.string().min(1).nullable(),
        userConfigurable: z.boolean(),
        anchor: z.enum(Enum.values(OverlayAnchor)),
        alwaysOnTop: z.boolean(),
        hideOnBlur: z.boolean(),
        pinnable: z.boolean(),
        resizable: z.boolean(),
        vibrancy: z.boolean(),
        displays: z.enum(["active", "primary", "all"]),
      }),
    )
    .default(() => ({})),
  menus: z
    .object({
      applicationMenu: z.boolean(),
      contextMenu: z.boolean(),
      standardRoles: z.array(z.string().min(1)),
      docsUrl: z.url().nullable(),
    })
    .default(() => ({
      applicationMenu: true,
      contextMenu: true,
      standardRoles: [],
      docsUrl: null,
    })),
  tray: z
    .object({
      enabled: z.boolean(),
      keepAliveDefault: z.boolean(),
      onClick: z.enum(Enum.values(TrayClickAction)),
      badge: z.boolean(),
      showItem: z.boolean(),
    })
    .default(() => ({
      enabled: false,
      keepAliveDefault: false,
      onClick: TrayClickAction.ToggleMain,
      badge: false,
      showItem: true,
    })),
  deepLinks: z
    .object({
      scheme: z
        .string()
        .regex(/^[a-z][a-z0-9+.-]*$/)
        .nullable(),
      claimHttpsOrigin: z.boolean(),
      route: ROUTE,
    })
    .default(() => ({ scheme: null, claimHttpsOrigin: false, route: "/open?url=%s" })),
  updates: z
    .object({
      enabled: z.boolean(),
      channels: z.array(z.string().min(1)).min(1),
      checkEvery: DURATION_SCHEMA,
      installOn: z.enum(Enum.values(InstallMoment)),
      stagingPercentage: z.int().min(1).max(100),
      userSelectableChannel: z.boolean(),
      differential: z.boolean(),
    })
    .default(() => ({
      enabled: false,
      channels: ["latest"],
      checkEvery: Duration.hours(6),
      installOn: InstallMoment.Quit,
      stagingPercentage: 100,
      userSelectableChannel: false,
      differential: true,
    })),
  devices: z
    .object({
      camera: DEVICE,
      microphone: DEVICE,
      usb: DEVICE,
      bluetooth: DEVICE,
      serial: DEVICE,
      hid: DEVICE,
    })
    .default(() => ({})),
  permissions: z
    .object({
      allow: z.array(z.string().min(1)),
      mediaTypes: z.array(z.enum(["video", "audio"])),
      devices: z.array(z.enum(["usb", "hid", "serial", "bluetooth"])),
      allowedNavigationOrigins: z.array(z.string().min(1)),
    })
    .default(() => ({
      allow: [],
      mediaTypes: [],
      devices: [],
      allowedNavigationOrigins: ["app://bundle"],
    })),
  hardening: z
    .object({
      disableDevToolsInProduction: z.boolean(),
      pinnedSpki: z.array(z.string().min(1)),
    })
    .default(() => ({ disableDevToolsInProduction: true, pinnedSpki: [] })),
  launchAtLoginDefault: z.boolean().default(false),
  crashReporter: z.boolean().default(false),
  offlineStore: z.enum(Enum.values(OfflineStore)).default(OfflineStore.EncryptedIndexedDb),
});
