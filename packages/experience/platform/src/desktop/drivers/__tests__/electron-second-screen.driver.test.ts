/**
 * Stackra file contract:
 * Purpose: unit tests of `ElectronSecondScreenDriver`: it opens a hardened, frameless, full-screen window on the
 *          external display at a route of the main window's origin, reuses it for the next route, closes it, and
 *          refuses on `window` with no external display or no main window.
 * Boundary: test only; Electron is mocked.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0339 (open question 3); ADR 0251 (decision 3).
 */
import { beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { ElectronSecondScreenDriver } from "#desktop/drivers/electron-second-screen.driver";

const electron = vi.hoisted(() => {
  const created: {
    options: unknown;
    loadURL: ReturnType<typeof vi.fn>;
    close: ReturnType<typeof vi.fn>;
  }[] = [];
  class FakeWindow {
    readonly loadURL = vi.fn(async () => undefined);

    readonly close = vi.fn();

    readonly options: unknown;

    constructor(options: unknown) {
      this.options = options;
      created.push(this);
    }

    once() {}

    on() {}

    show() {}

    isDestroyed() {
      return false;
    }
  }
  return {
    FakeWindow,
    created,
    displays: [] as {
      id: number;
      bounds: { x: number; y: number; width: number; height: number };
    }[],
    main: { webContents: { getURL: () => "app://bundle/pos" } } as unknown,
  };
});

vi.mock("electron", () => ({
  screen: {
    getPrimaryDisplay: () => electron.displays[0],
    getAllDisplays: () => electron.displays,
  },
  BrowserWindow: Object.assign(electron.FakeWindow, {
    getAllWindows: () => [electron.main, ...electron.created],
  }),
}));

const primary = { id: 1, bounds: { x: 0, y: 0, width: 1920, height: 1080 } };
const external = { id: 2, bounds: { x: 1920, y: 0, width: 1024, height: 600 } };

beforeEach(() => {
  electron.created.length = 0;
  electron.displays = [primary, external];
  electron.main = { webContents: { getURL: () => "app://bundle/pos" } };
});

describe("ElectronSecondScreenDriver", () => {
  it("opens a hardened full-screen window on the external display", async () => {
    const screen = new ElectronSecondScreenDriver();
    expect(await screen.probe()).toEqual({ ok: true, data: undefined });
    expect(await screen.open("/customer-display")).toEqual({ ok: true, data: undefined });
    const [window] = electron.created;
    expect(window?.options).toMatchObject({
      x: 1920,
      y: 0,
      width: 1024,
      height: 600,
      frame: false,
      fullscreen: true,
      webPreferences: { contextIsolation: true, sandbox: true, nodeIntegration: false },
    });
    expect(window?.loadURL).toHaveBeenCalledWith("app://bundle/customer-display");

    await screen.open("/customer-display/idle");
    expect(electron.created).toHaveLength(1);
    expect(window?.loadURL).toHaveBeenLastCalledWith("app://bundle/customer-display/idle");

    await screen.close();
    expect(window?.close).toHaveBeenCalled();
  });

  it("refuses with no external display or no main window", async () => {
    const refused = { ok: false, error: { code: "unavailable", capability: "window" } };
    electron.displays = [primary];
    const screen = new ElectronSecondScreenDriver();
    expect(await screen.probe()).toEqual(refused);
    expect(await screen.open("/customer-display")).toEqual(refused);
    electron.displays = [primary, external];
    electron.main = { webContents: { getURL: () => "" } };
    expect(await screen.open("/customer-display")).toEqual(refused);
    await expect(screen.open("https://evil.example")).rejects.toThrow(TypeError);
  });
});
