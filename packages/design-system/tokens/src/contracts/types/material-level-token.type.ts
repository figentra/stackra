/**
 * Stackra file contract:
 * Purpose: `MaterialLevelToken`, part of the token schema of the Stackra Design System (see `Theme`): one level of the
 *          material, in the `glass` mode; the other modes scale it. Every field after `saturation` is optional, so a
 *          theme written before the glass levels still validates.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (Stackra Design System); ADR 0320 (the glass material); ADR 0501 (tokens v2).
 */
import type { MaterialElevation } from "#contracts/enums/material-elevation.enum";
import type { MaterialTintSource } from "#contracts/enums/material-tint-source.enum";
import type { VibrancyRole } from "#contracts/enums/vibrancy-role.enum";
import type { MaterialInnerDepth } from "#contracts/types/material-inner-depth.type";
import type { ModeShare } from "#contracts/types/mode-share.type";

/** One level of the material, in the `glass` mode; the other modes scale it. */
export interface MaterialLevelToken {
  /** How much of the tint source the fill is, 0 (clear) to 1 (opaque). */
  readonly fill: ModeShare;
  /** The backdrop blur radius, a px length. */
  readonly blur: string;
  /** The backdrop `saturate()` factor; 1 leaves the colour as it is. */
  readonly saturation: number;
  /** The colour the fill is mixed from; `surface` when left out. */
  readonly tintSource?: MaterialTintSource | undefined;
  /** How much accent is mixed into the fill, 0 to 0.24; 0 when left out. */
  readonly tint?: number | undefined;
  /** The backdrop `brightness()` factor on the light scheme (dark is always 1); 1 when left out. */
  readonly brightness?: number | undefined;
  /** The hairline edge, a share of `foreground` (of white on `glass-clear`); the theme-wide `edge` when left out. */
  readonly edge?: ModeShare | undefined;
  /** The top rim light, a share of white; the theme-wide `highlight` when left out. */
  readonly rim?: ModeShare | undefined;
  /** The lit lower rim, a share of the rim light, 0 to 1; 0 when left out. */
  readonly specular?: number | undefined;
  /** The inner shadow that gives glass its thickness; none when left out. */
  readonly innerDepth?: MaterialInnerDepth | null | undefined;
  /** The outer shadow; `none` when left out. */
  readonly elevation?: MaterialElevation | undefined;
  /**
   * `glass-clear` only: the black dimming layer under clear glass, 0 to 1. The renderer never draws it below the
   * floors (`GLASS_CLEAR_DIM_FLOORS`: 0.50 behind glyphs, 0.55 behind labels).
   */
  readonly dim?: number | undefined;
  /** The label roles the level allows; read by the contrast tests and review, never by the renderer. */
  readonly vibrancy?: readonly VibrancyRole[] | undefined;
}
