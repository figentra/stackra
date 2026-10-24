/**
 * Stackra file contract:
 * Purpose: `TrayClickAction`, what a click on the desktop tray icon does (`DesktopConfig.tray.onClick`).
 * Boundary: an `Enum.of` value plus the type of the same name; read by the Electron main process.
 * Runtime: isomorphic
 * Governing contract: ADR 0281 (decision 3); ADR 0254 (tray); ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";

/** What a tray click does. */
export const TrayClickAction = Enum.of({
  /** Shows the main window, or hides it when it is focused. */
  ToggleMain: "toggle_main",
  /** Opens the tray menu. */
  OpenMenu: "open_menu",
});

/** One of the codes above. */
export type TrayClickAction = Enum.Value<typeof TrayClickAction>;
