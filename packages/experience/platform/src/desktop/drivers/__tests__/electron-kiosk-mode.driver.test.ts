/**
 * Stackra file contract:
 * Purpose: unit tests of `ElectronKioskModeDriver`: entering locks every open and later window into kiosk with no menu
 *          bar, removes the application menu and the global shortcuts, closes developer tools in a packaged build, and
 *          exiting gives the windows and the menu back; both are idempotent.
 * Boundary: test only; Electron is mocked.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0281 (STA-469 note); ADR 0251 (decision 3).
 */
import { EventEmitter } from "node:events";

import { beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { ElectronKioskModeDriver } from "#desktop/drivers/electron-kiosk-mode.driver";

/** A window double that records kiosk and menu-bar calls. */
function fakeWindow() {
  const contents = Object.assign(new EventEmitter(), { closeDevTools: vi.fn() });
  return { setKiosk: vi.fn(), setMenuBarVisibility: vi.fn(), webContents: contents };
}

const electron = vi.hoisted(() => ({
  // the app's events, as Node's EventEmitter, built before the imports are hoisted above it
  app: {
    isPackaged: true,
    handlers: new Map<string, Set<(...args: unknown[]) => void>>(),
    on(event: string, handler: (...args: unknown[]) => void) {
      const set = this.handlers.get(event) ?? new Set();
      set.add(handler);
      this.handlers.set(event, set);
    },
    off(event: string, handler: (...args: unknown[]) => void) {
      this.handlers.get(event)?.delete(handler);
    },
    emit(event: string, ...args: unknown[]) {
      for (const handler of this.handlers.get(event) ?? []) handler(...args);
    },
    listenerCount(event: string) {
      return this.handlers.get(event)?.size ?? 0;
    },
    removeAllListeners() {
      this.handlers.clear();
    },
  },
  windows: [] as { setKiosk: unknown }[],
  menu: { label: "app menu" },
  setApplicationMenu: vi.fn(),
  unregisterAll: vi.fn(),
}));

vi.mock("electron", () => ({
  app: electron.app,
  BrowserWindow: { getAllWindows: () => electron.windows },
  Menu: {
    getApplicationMenu: () => electron.menu,
    setApplicationMenu: electron.setApplicationMenu,
  },
  globalShortcut: { unregisterAll: electron.unregisterAll },
}));

beforeEach(() => {
  electron.windows = [fakeWindow()];
  electron.setApplicationMenu.mockReset();
  electron.unregisterAll.mockReset();
  electron.app.removeAllListeners();
});

describe("ElectronKioskModeDriver", () => {
  it("locks every window and takes the menu and shortcuts away", async () => {
    const kiosk = new ElectronKioskModeDriver();
    expect(await kiosk.enter()).toEqual({ ok: true, data: undefined });
    const [main] = electron.windows as ReturnType<typeof fakeWindow>[];
    expect(main?.setKiosk).toHaveBeenCalledWith(true);
    expect(main?.setMenuBarVisibility).toHaveBeenCalledWith(false);
    expect(main?.webContents.closeDevTools).toHaveBeenCalled();
    expect(electron.setApplicationMenu).toHaveBeenCalledWith(null);
    expect(electron.unregisterAll).toHaveBeenCalled();
    expect(await kiosk.isActive()).toBe(true);

    const later = fakeWindow();
    electron.app.emit("browser-window-created", {}, later);
    expect(later.setKiosk).toHaveBeenCalledWith(true);
    later.webContents.emit("devtools-opened");
    expect(later.webContents.closeDevTools).toHaveBeenCalledTimes(2);

    await kiosk.enter();
    expect(electron.unregisterAll).toHaveBeenCalledTimes(1);
  });

  it("gives the windows and the menu back on exit", async () => {
    const kiosk = new ElectronKioskModeDriver();
    expect(await kiosk.exit()).toEqual({ ok: true, data: undefined });
    await kiosk.enter();
    await kiosk.exit();
    const [main] = electron.windows as ReturnType<typeof fakeWindow>[];
    expect(main?.setKiosk).toHaveBeenLastCalledWith(false);
    expect(main?.setMenuBarVisibility).toHaveBeenLastCalledWith(true);
    expect(electron.setApplicationMenu).toHaveBeenLastCalledWith(electron.menu);
    expect(electron.app.listenerCount("browser-window-created")).toBe(0);
    expect(await kiosk.isActive()).toBe(false);
  });
});
