/**
 * Stackra file contract:
 * Purpose: `OverlayAnchor`, where a desktop overlay opens (`DesktopConfig.overlays[].anchor`, ADR 0281 decision 4).
 * Boundary: an `Enum.of` value plus the type of the same name; read by the Electron main process.
 * Runtime: isomorphic
 * Governing contract: ADR 0281 (decisions 4 and 8); ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";

/** Where an overlay opens. */
export const OverlayAnchor = Enum.of({
  /** Centred on the display. */
  ScreenCenter: "screen_center",
  /** Under the tray icon. */
  TrayIcon: "tray_icon",
  /** Docked to the right edge. */
  EdgeRight: "edge_right",
  /** Docked to the left edge. */
  EdgeLeft: "edge_left",
  /** At the pointer. */
  Cursor: "cursor",
});

/** One of the codes above. */
export type OverlayAnchor = Enum.Value<typeof OverlayAnchor>;
