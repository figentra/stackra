/**
 * Stackra file contract:
 * Purpose: `browserWindowOptions`, the Electron `BrowserWindow` options of one `DesktopConfig.windows` entry: its
 *          size, limits and title bar, plus what its `WindowKind` means: a utility window takes no taskbar entry; a
 *          kiosk window fills its display in Electron's kiosk mode with no frame, menu bar, resizing or closing.
 * Boundary: pure; the shell spreads the result and adds its own `webPreferences` (the hardening baseline of ADR 0251
 *           is the shell's, never this function's). Imports Electron's types only, so the entry stays loadable.
 *           `route`, `persistBounds` and `openOnLaunch` are the shell's to apply.
 * Runtime: isomorphic
 * Governing contract: ADR 0281 (decisions 1 and 3); ADR 0428; ADR 0449 (decision 5).
 */
import type { BrowserWindowConstructorOptions } from "electron";

import type { DesktopOptions } from "#core/schemas/desktop-options.schema";
import { WindowKind } from "#core/enums/window-kind.enum";

/**
 * The `BrowserWindow` options of a configured window.
 *
 * @example
 * // generated main-process shell
 * const window = new BrowserWindow({ ...browserWindowOptions(desktop.windows.main), show: false, webPreferences });
 */
export function browserWindowOptions(
  window: DesktopOptions["windows"][string],
): BrowserWindowConstructorOptions {
  const base: BrowserWindowConstructorOptions = {
    width: window.width,
    height: window.height,
    minWidth: window.minWidth,
    minHeight: window.minHeight,
    resizable: window.resizable,
    titleBarStyle: window.titleBarStyle,
  };
  if (window.kind === WindowKind.Utility) return { ...base, skipTaskbar: true };
  if (window.kind === WindowKind.Kiosk)
    return {
      ...base,
      kiosk: true,
      fullscreen: true,
      frame: false,
      autoHideMenuBar: true,
      resizable: false,
      movable: false,
      minimizable: false,
      maximizable: false,
      closable: false,
    };
  return base;
}
