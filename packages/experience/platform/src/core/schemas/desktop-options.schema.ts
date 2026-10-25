/**
 * Stackra file contract:
 * Purpose: `DesktopOptions`, the shape of `DesktopConfig`: what the Electron main process reads while the desktop app
 *          runs: desktop mode, windows, named overlays with their shortcuts, menus, tray, deep links, auto-update,
 *          the devices used with their reasons, renderer permissions, hardening knobs, launch at login, crash reports
 *          and where the offline data lives.
 * Boundary: a shape class; it registers this package's own schema (`DESKTOP_CONFIG_SCHEMA`) for itself when the module
 *           loads, so `buildConfig(DesktopConfig)` validates with no generated file. A nested object is replaced
 *           whole by an override, which spreads the base first. Packaging, signing and the update feed are not here
 *           (stackra.config.ts `desktop`, runway `release.desktop`); `titleBarStyle`, `standardRoles`, `allow` and
 *           `permissions.devices` are Electron's own values. Desktop-only: gen refuses it without `Target.Desktop`.
 * Runtime: isomorphic
 * Governing contract: ADR 0281 (decisions 3, 4 and 6); ADR 0251 (decision 3); ADR 0254; ADR 0294 (decisions 19 and
 *                     26); ADR 0305 (rule 34).
 */
import { Duration } from "@stackra/contracts";
import { OfflineStore } from "@stackra/storage";
import { registerSchemas, Schema } from "@stackra/validation";

import { DESKTOP_CONFIG_SCHEMA } from "#core/constants/desktop-config-schema.constant";
import { DesktopMode } from "#core/enums/desktop-mode.enum";
import { InstallMoment } from "#core/enums/install-moment.enum";
import type { OverlayAnchor } from "#core/enums/overlay-anchor.enum";
import type { OverlayStyle } from "#core/enums/overlay-style.enum";
import { TrayClickAction } from "#core/enums/tray-click-action.enum";
import { WindowKind } from "#core/enums/window-kind.enum";

/**
 * The desktop settings.
 *
 * @example
 * export class DesktopConfig extends BaseDesktopConfig {
 *   override mode: DesktopMode = DesktopMode.Hybrid;
 *   override tray: BaseDesktopConfig["tray"] = { ...this.tray, enabled: true };
 * }
 */
export class DesktopOptions extends Schema {
  /** Dock app, menu-bar app or both (ADR 0281 decision 3). */
  mode: DesktopMode = DesktopMode.Window;

  /** One window per key; `main` is required and is the window the app opens. */
  windows: Record<
    string,
    {
      /** The route the window opens on. */
      route: string;
      /** Initial width in pixels. */
      width: number;
      /** Initial height in pixels. */
      height: number;
      /** Smallest width. */
      minWidth: number;
      /** Smallest height. */
      minHeight: number;
      /** The user may resize it. */
      resizable: boolean;
      /** Reopen with the size and position it closed with. */
      persistBounds: boolean;
      /** Electron's title bar style. */
      titleBarStyle: "default" | "hidden" | "hiddenInset" | "customButtonsOnHover";
      /** An ordinary or a utility window. */
      kind: WindowKind;
      /** Open it when the app starts. */
      openOnLaunch: boolean;
    }
  > = {
    main: {
      route: "/",
      width: 1280,
      height: 800,
      minWidth: 800,
      minHeight: 600,
      resizable: true,
      persistBounds: true,
      titleBarStyle: "default",
      kind: WindowKind.Normal,
      openOnLaunch: true,
    },
  };

  /** Named overlays (ADR 0281 decision 4), each opened by its shortcut, the tray menu or an in-app button. */
  overlays: Record<
    string,
    {
      /** A launcher bar or a docked panel. */
      style: OverlayStyle;
      /** The route rendered inside the overlay. */
      route: string;
      /** The global shortcut (an Electron accelerator), registered by main only; null for none. */
      shortcut: string | null;
      /** The user may rebind or disable the shortcut in settings. */
      userConfigurable: boolean;
      /** Where it opens. */
      anchor: OverlayAnchor;
      /** Stays above other windows. */
      alwaysOnTop: boolean;
      /** Closes when it loses focus. */
      hideOnBlur: boolean;
      /** The user may pin it open. */
      pinnable: boolean;
      /** The user may resize it. */
      resizable: boolean;
      /** A vibrancy or blur background where the OS has one. */
      vibrancy: boolean;
      /** The displays it may open on. */
      displays: "active" | "primary" | "all";
    }
  > = {};

  /** The shell's menus: the menu bar and context menu switches, Electron's role items, and the Help link. */
  menus: {
    /** Show the application menu bar. */
    applicationMenu: boolean;
    /** Show the context menu with spelling suggestions and contributed items. */
    contextMenu: boolean;
    /** Electron menu roles the shell places in their usual menus (`appMenu`, `editMenu`, `quit`). */
    standardRoles: string[];
    /** The documentation link of the Help menu; null for none. */
    docsUrl: string | null;
  } = { applicationMenu: true, contextMenu: true, standardRoles: [], docsUrl: null };

  /** The tray icon. */
  tray: {
    /** Show a tray icon. */
    enabled: boolean;
    /** Keep the app alive after the last window closes until the user changes it (off: ADR 0254). */
    keepAliveDefault: boolean;
    /** What a click does. */
    onClick: TrayClickAction;
    /** Mirror the unread count on the tray icon. */
    badge: boolean;
    /** Put a "Show" item at the top of the tray menu. */
    showItem: boolean;
  } = {
    enabled: false,
    keepAliveDefault: false,
    onClick: TrayClickAction.ToggleMain,
    badge: false,
    showItem: true,
  };

  /** Deep links: the custom scheme registered at install and the route a link opens (`%s` is the link). */
  deepLinks: {
    /** The custom scheme without `:` (`acme-console`); null registers none. */
    scheme: string | null;
    /** Also claim links on the app's https origin. */
    claimHttpsOrigin: boolean;
    /** The route a link opens; `%s` is replaced by the link. */
    route: string;
  } = { scheme: null, claimHttpsOrigin: false, route: "/open?url=%s" };

  /** Auto-update through electron-updater (ADR 0254). */
  updates: {
    /** Check for updates. */
    enabled: boolean;
    /** The channels published to the feed; `latest` is stable. */
    channels: string[];
    /** How often to check. */
    checkEvery: Duration;
    /** When a downloaded update installs. */
    installOn: InstallMoment;
    /** The staged-rollout share written to the feed, 1 to 100. */
    stagingPercentage: number;
    /** The user may pick a channel in settings. */
    userSelectableChannel: boolean;
    /** Download only the changed blocks. */
    differential: boolean;
  } = {
    enabled: false,
    channels: ["latest"],
    checkEvery: Duration.hours(6),
    installOn: InstallMoment.Quit,
    stagingPercentage: 100,
    userSelectableChannel: false,
    differential: true,
  };

  /** The devices the app uses, each with the translation key of the reason the OS shows when it asks. */
  devices: {
    /** The camera. */
    camera?: { reason: string };
    /** The microphone. */
    microphone?: { reason: string };
    /** USB devices. */
    usb?: { reason: string };
    /** Bluetooth devices. */
    bluetooth?: { reason: string };
    /** Serial ports. */
    serial?: { reason: string };
    /** HID devices. */
    hid?: { reason: string };
  } = {};

  /** What main grants the renderer; anything else is refused. */
  permissions: {
    /** Electron permission names main grants (`notifications`, `media`). */
    allow: string[];
    /** The media types `media` covers. */
    mediaTypes: ("video" | "audio")[];
    /** The device families main's device handlers allow. */
    devices: ("usb" | "hid" | "serial" | "bluetooth")[];
    /** Origins the renderer may navigate within; everything else opens in the system browser. */
    allowedNavigationOrigins: string[];
  } = { allow: [], mediaTypes: [], devices: [], allowedNavigationOrigins: ["app://bundle"] };

  /** Tighten-only knobs over the hardening baseline (ADR 0251 decision 3). */
  hardening: {
    /** No devtools in a production build. */
    disableDevToolsInProduction: boolean;
    /** Certificate SPKI pins for the API origin. */
    pinnedSpki: string[];
  } = { disableDevToolsInProduction: true, pinnedSpki: [] };

  /**
   * Start in kiosk mode (ADR 0281, STA-469 note): a kiosk window, no menu, no developer tools in a packaged build,
   * overlays and global shortcuts off. The launch default only; a tenant's kiosk setting switches it at run time.
   */
  kioskOnLaunch = false;

  /** Launch at login, until the user changes it. */
  launchAtLoginDefault = false;

  /** Send minidumps through the error reporter. */
  crashReporter = false;

  /** Where the persisted query cache and the offline queue live on desktop. */
  offlineStore: OfflineStore = OfflineStore.EncryptedIndexedDb;
}

registerSchemas([[DesktopOptions, DESKTOP_CONFIG_SCHEMA]]);
