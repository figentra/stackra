/**
 * Stackra file contract:
 * Purpose: `ThemeMaterials`, part of the token schema of the Stackra Design System (see `Theme`): the material: its
 *          levels, the light along its edge, the theme's family, its default mode and the role overrides.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (Stackra Design System); ADR 0320 (the glass material); ADR 0501 (tokens v2).
 */
import type { MaterialFamily } from "#contracts/enums/material-family.enum";
import type { MaterialLevel } from "#contracts/enums/material-level.enum";
import type { MaterialMode } from "#contracts/enums/material-mode.enum";
import type { MaterialLevelToken } from "#contracts/types/material-level-token.type";
import type { MaterialRoleMap } from "#contracts/types/material-role-map.type";
import type { ModeShare } from "#contracts/types/mode-share.type";

/** The material: its levels, the edge light, the family and the default mode. */
export interface ThemeMaterials {
  /** The levels, rendered as `--material-<level>-fill`, `--material-<level>-filter` and `.material-<level>`. */
  readonly levels: { readonly [Level in MaterialLevel]: MaterialLevelToken };
  /** How much of `foreground` the hairline edge is, `--material-edge`. */
  readonly edge: ModeShare;
  /** How much of white the top rim light is, `--material-highlight`. */
  readonly highlight: ModeShare;
  /** The family a page without `data-family` draws in; `studio` when left out. */
  readonly family?: MaterialFamily | undefined;
  /**
   * The mode a page without `data-material` draws in; `DesignSystemProvider` leaves it in place unless it is given
   * a mode. `glass` (the theme as written) when left out.
   */
  readonly defaultMode?: MaterialMode | undefined;
  /** Per family, the roles that draw another level than `MATERIAL_FAMILY_ROLES` says. */
  readonly roles?:
    | { readonly [Family in MaterialFamily]?: Partial<MaterialRoleMap> | undefined }
    | undefined;
}
