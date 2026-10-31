/**
 * Stackra file contract:
 * Purpose: `GlassSurfaceProps`, the props of the native `GlassSurface`: the material role, whether clear glass holds a
 *          label (the higher dim floor), whether a press lights it (interactive Liquid Glass), an accent tint for a
 *          prominent control, plus a View's own props.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0320 (decision 7 as amended 2026-10-31); ADR 0305 (Props in their own file).
 */
import type { MaterialRole } from "@stackra/tokens/contracts";
import type { ReactNode } from "react";
import type { ViewProps } from "react-native";

/** Props of the native GlassSurface. */
export interface GlassSurfaceProps extends ViewProps {
  /** The material role this surface plays; the family decides its level. (`role` stays the View's accessibility role.) */
  readonly material: MaterialRole;
  /** Clear glass only: the surface holds a label, so its dim is at least 0.55 (0.50 for glyphs alone). */
  readonly holdsLabel?: boolean | undefined;
  /** Liquid Glass lights and lifts under a press; only for a surface a person presses. */
  readonly isInteractive?: boolean | undefined;
  /** Tints the glass with the accent, for a prominent control (a FAB, a glass button on media). */
  readonly isProminent?: boolean | undefined;
  /** The surface's content. */
  readonly children?: ReactNode;
}
