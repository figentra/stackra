/**
 * Stackra file contract:
 * Purpose: `ThemeMaterials`, part of the token schema of the Stackra Design System (see `Theme`): the glass material:
 *          its three levels and the light that runs along its edge.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (Stackra Design System); ADR 0231 (design tokens: CSS property form).
 */
import type { MaterialLevel } from "#contracts/enums/material-level.enum";
import type { MaterialLevelToken } from "#contracts/types/material-level-token.type";
import type { ModeShare } from "#contracts/types/mode-share.type";

/** The glass material: its three levels and the light that runs along its edge. */
export interface ThemeMaterials {
  /** The levels, rendered as `--material-<level>-fill` and `--material-<level>-filter`. */
  readonly levels: { readonly [Level in MaterialLevel]: MaterialLevelToken };
  /** How much of `foreground` the hairline edge is, `--material-edge`. */
  readonly edge: ModeShare;
  /** How much of white the top rim light is, `--material-highlight`. */
  readonly highlight: ModeShare;
}
