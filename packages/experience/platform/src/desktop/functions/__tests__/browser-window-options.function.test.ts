/**
 * Stackra file contract:
 * Purpose: unit tests of `browserWindowOptions`: an ordinary window keeps its size, limits and title bar; a utility
 *          window takes no taskbar entry; a kiosk window fills its display with no frame, menu bar, resizing or
 *          closing, whatever its entry says about resizing.
 * Boundary: test only; pure, no Electron.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0281; ADR 0449 (decision 5).
 */
import { describe, expect, it } from "@stackra/testing";

import { WindowKind } from "#core/enums/window-kind.enum";
import { browserWindowOptions } from "#desktop/functions/browser-window-options.function";

const MAIN = {
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
};

describe("browserWindowOptions", () => {
  it("keeps an ordinary window's size, limits and title bar", () => {
    expect(browserWindowOptions(MAIN)).toEqual({
      width: 1280,
      height: 800,
      minWidth: 800,
      minHeight: 600,
      resizable: true,
      titleBarStyle: "default",
    });
  });

  it("keeps a utility window off the taskbar", () => {
    expect(browserWindowOptions({ ...MAIN, kind: WindowKind.Utility }).skipTaskbar).toBe(true);
  });

  it("locks a kiosk window to its display", () => {
    expect(browserWindowOptions({ ...MAIN, kind: WindowKind.Kiosk })).toMatchObject({
      kiosk: true,
      fullscreen: true,
      frame: false,
      autoHideMenuBar: true,
      resizable: false,
      movable: false,
      minimizable: false,
      maximizable: false,
      closable: false,
    });
  });
});
