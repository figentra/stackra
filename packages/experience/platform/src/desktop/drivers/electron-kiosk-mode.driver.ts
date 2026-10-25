/**
 * Stackra file contract:
 * Purpose: `ElectronKioskModeDriver`, the `KioskMode` driver of the desktop main process: every window, open now or
 *          created later, becomes a kiosk window with no menu bar; the application menu is removed; every global
 *          shortcut (overlays included) is unregistered; and in a packaged build developer tools close as soon as they
 *          open. `exit` gives the windows and the menu back.
 * Boundary: main only. Electron loads when a call runs, so the `./desktop` entry stays loadable in the renderer.
 *           Global shortcuts are not re-registered on `exit`: the shell registers them at launch, so they come back
 *           with the next launch. Whether to enter is a tenant setting the host reads; `DesktopConfig.kioskOnLaunch`
 *           is the launch default.
 * Runtime: node
 * Governing contract: ADR 0281 (STA-469 note: kiosk window, no menu, no developer tools in production, overlays and
 *                     global shortcuts off); ADR 0344; ADR 0251 (decision 3); ADR 0250 (decision 3).
 */
import { Driver } from "@stackra/container";
import type { BrowserWindow, Menu } from "electron";

import { KioskMode } from "#contracts/ports/kiosk-mode.port";
import type { CapabilityResult } from "#contracts/types/capability-result.type";

/**
 * Kiosk mode in Electron's main process.
 *
 * @example
 * // generated main-process wiring, desktop target
 * { port: KioskMode, candidates: { electron: () => import("@stackra/platform/desktop").then((m) => m.ElectronKioskModeDriver) } }
 */
export class ElectronKioskModeDriver extends Driver(KioskMode) {
  /** Whether kiosk mode is on. */
  private active = false;

  /** The application menu taken away on entry, given back on exit. */
  private menu: Menu | null = null;

  /** Stops locking new windows; set while active. */
  private release: (() => void) | undefined = undefined;

  /** Electron's main process can always enter kiosk mode. */
  async probe(): Promise<CapabilityResult> {
    return { ok: true, data: undefined };
  }

  /** Locks every window and takes the menu, the shortcuts and (packaged) the developer tools away. */
  async enter(): Promise<CapabilityResult> {
    if (this.active) return { ok: true, data: undefined };
    const { app, BrowserWindow, Menu, globalShortcut } = await import("electron");
    const lock = (window: BrowserWindow): void => {
      window.setKiosk(true);
      window.setMenuBarVisibility(false);
      if (!app.isPackaged) return;
      window.webContents.closeDevTools();
      window.webContents.on("devtools-opened", () => window.webContents.closeDevTools());
    };
    const onCreated = (_event: unknown, window: BrowserWindow): void => lock(window);
    this.menu = Menu.getApplicationMenu();
    Menu.setApplicationMenu(null);
    globalShortcut.unregisterAll();
    for (const window of BrowserWindow.getAllWindows()) lock(window);
    app.on("browser-window-created", onCreated);
    this.release = () => app.off("browser-window-created", onCreated);
    this.active = true;
    return { ok: true, data: undefined };
  }

  /** Gives the windows and the menu back. */
  async exit(): Promise<CapabilityResult> {
    if (!this.active) return { ok: true, data: undefined };
    const { BrowserWindow, Menu } = await import("electron");
    this.release?.();
    this.release = undefined;
    for (const window of BrowserWindow.getAllWindows()) {
      window.setKiosk(false);
      window.setMenuBarVisibility(true);
    }
    Menu.setApplicationMenu(this.menu);
    this.menu = null;
    this.active = false;
    return { ok: true, data: undefined };
  }

  /** Whether kiosk mode is on. */
  async isActive(): Promise<boolean> {
    return this.active;
  }
}
