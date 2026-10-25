/**
 * Stackra file contract:
 * Purpose: `ElectronSecondScreenDriver`, the `SecondScreen` driver of the desktop main process: a frameless,
 *          full-screen window on the first display that is not the primary one, loading a route of the app's own
 *          origin (the customer display).
 * Boundary: main only; Electron loads when a call runs. The window has the hardened web preferences of every app window
 *           (context isolation, sandbox, no node integration, web security, no webview) and no preload: it needs no
 *           bridge, since the customer display is fed over a same-origin channel. Its origin is the main window's, so
 *           the same route works in development and packaged. No second display, or no main window to take the origin
 *           from, refuses `unavailable` on `window`.
 * Runtime: node
 * Governing contract: ADR 0339 (open question 3: a second Electron window); ADR 0344; ADR 0251 (decision 3: the
 *                     hardening baseline); ADR 0250 (decision 3).
 */
import { Driver } from "@stackra/container";
import type { BrowserWindow } from "electron";

import { SecondScreen } from "#contracts/ports/second-screen.port";
import type { CapabilityResult } from "#contracts/types/capability-result.type";
import { Capability } from "#core/enums/capability.enum";
import { refuse } from "#core/functions/refuse.function";

/**
 * The second-display window of a till.
 *
 * @example
 * // generated main-process wiring, desktop target
 * { port: SecondScreen, candidates: { electron: () => import("@stackra/platform/desktop").then((m) => m.ElectronSecondScreenDriver) } }
 */
export class ElectronSecondScreenDriver extends Driver(SecondScreen) {
  /** The open window; undefined when closed. */
  private window: BrowserWindow | undefined = undefined;

  /** Answers when a display other than the primary is connected. */
  async probe(): Promise<CapabilityResult> {
    const { screen } = await import("electron");
    const primary = screen.getPrimaryDisplay();
    return screen.getAllDisplays().some((display) => display.id !== primary.id)
      ? { ok: true, data: undefined }
      : refuse(Capability.Window, "unavailable");
  }

  /**
   * Opens the window on the second display at `route`, or loads `route` in the one already open.
   *
   * @throws TypeError when `route` is not a path starting with a single `/`.
   */
  async open(route: string): Promise<CapabilityResult> {
    if (!route.startsWith("/") || route.startsWith("//"))
      throw new TypeError(`SecondScreen.open needs a path of the app, got "${route}"`);
    const { BrowserWindow, screen } = await import("electron");
    const primary = screen.getPrimaryDisplay();
    const external = screen.getAllDisplays().find((display) => display.id !== primary.id);
    const main = BrowserWindow.getAllWindows().find((window) => window !== this.window);
    const base = main?.webContents.getURL() ?? "";
    if (external === undefined || base === "") return refuse(Capability.Window, "unavailable");
    const url = new URL(route, base).href;
    if (this.window === undefined || this.window.isDestroyed()) {
      const { x, y, width, height } = external.bounds;
      const window = new BrowserWindow({
        x,
        y,
        width,
        height,
        frame: false,
        fullscreen: true,
        show: false,
        webPreferences: {
          contextIsolation: true,
          sandbox: true,
          nodeIntegration: false,
          webSecurity: true,
          webviewTag: false,
        },
      });
      window.once("ready-to-show", () => window.show());
      window.on("closed", () => {
        if (this.window === window) this.window = undefined;
      });
      this.window = window;
    }
    await this.window.loadURL(url);
    return { ok: true, data: undefined };
  }

  /** Closes the window. */
  async close(): Promise<CapabilityResult> {
    if (this.window !== undefined && !this.window.isDestroyed()) this.window.close();
    this.window = undefined;
    return { ok: true, data: undefined };
  }
}
