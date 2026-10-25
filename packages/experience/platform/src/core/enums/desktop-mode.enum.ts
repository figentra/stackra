/**
 * Stackra file contract:
 * Purpose: `DesktopMode`, how the desktop app lives on the OS (`DesktopConfig.mode`): a dock app, a menu-bar app, or
 *          both (ADR 0281 decision 3).
 * Boundary: an `Enum.of` value plus the type of the same name; read by the Electron main process and gen only.
 * Runtime: isomorphic
 * Governing contract: ADR 0281 (decisions 3 and 8); ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";

/** Dock app, menu-bar app or both. */
export const DesktopMode = Enum.of({
  /** A dock or taskbar app with no tray icon. */
  Window: "window",
  /** A menu-bar app only: no dock icon; the window opens from the tray icon. */
  Tray: "tray",
  /** A window and a tray icon; closing the window keeps the app in the tray only when the user opted in. */
  Hybrid: "hybrid",
});

/** One of the codes above. */
export type DesktopMode = Enum.Value<typeof DesktopMode>;
