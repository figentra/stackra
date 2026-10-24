/**
 * Stackra file contract:
 * Purpose: `WindowKind`, the kind of a desktop window (`DesktopConfig.windows[].kind`): an ordinary window or a
 *          utility window that floats over its parent and takes no taskbar entry.
 * Boundary: an `Enum.of` value plus the type of the same name; read by the Electron main process.
 * Runtime: isomorphic
 * Governing contract: ADR 0281; ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";

/** The kind of a window. */
export const WindowKind = Enum.of({
  /** An ordinary window. */
  Normal: "normal",
  /** A utility window over its parent, with no taskbar entry. */
  Utility: "utility",
});

/** One of the codes above. */
export type WindowKind = Enum.Value<typeof WindowKind>;
