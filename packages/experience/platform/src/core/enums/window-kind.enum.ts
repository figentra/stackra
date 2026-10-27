/**
 * Stackra file contract:
 * Purpose: `WindowKind`, the kind of a desktop window (`DesktopConfig.windows[].kind`): an ordinary window, a
 *          utility window that floats over its parent and takes no taskbar entry, or a kiosk window that fills its
 *          display with no frame, menu or way out (a self-checkout lane, an ordering kiosk, an entry kiosk).
 * Boundary: an `Enum.of` value plus the type of the same name; read by the Electron main process through
 *           `browserWindowOptions`. A kiosk window locks itself only; `KioskMode` locks the whole app.
 * Runtime: isomorphic
 * Governing contract: ADR 0281; ADR 0428; ADR 0449 (decision 5); ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";

/** The kind of a window. */
export const WindowKind = Enum.of({
  /** An ordinary window. */
  Normal: "normal",
  /** A utility window over its parent, with no taskbar entry. */
  Utility: "utility",
  /** A full-display window with no frame or menu that the user cannot leave. */
  Kiosk: "kiosk",
});

/** One of the codes above. */
export type WindowKind = Enum.Value<typeof WindowKind>;
