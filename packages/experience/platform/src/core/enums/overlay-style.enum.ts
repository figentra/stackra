/**
 * Stackra file contract:
 * Purpose: `OverlayStyle`, the shell of a desktop overlay (`DesktopConfig.overlays[].style`, ADR 0281 decision 4):
 *          a launcher bar or a docked panel.
 * Boundary: an `Enum.of` value plus the type of the same name; read by the Electron main process.
 * Runtime: isomorphic
 * Governing contract: ADR 0281 (decisions 4 and 8); ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";

/** The shell an overlay renders in. */
export const OverlayStyle = Enum.of({
  /** A wide prompt bar centred on the active display that grows with its results; closes on Esc or blur. */
  Launcher: "launcher",
  /** A card docked to an edge or under the tray icon; pinnable, resizable, remembers its bounds. */
  Panel: "panel",
});

/** One of the codes above. */
export type OverlayStyle = Enum.Value<typeof OverlayStyle>;
