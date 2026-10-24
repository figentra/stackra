/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./contracts` entry of @stackra/tokens, which has two public files, until
 *          `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { ColorRole } from "#contracts/enums/color-role.enum";
export { MaterialLevel } from "#contracts/enums/material-level.enum";
export { MaterialMode } from "#contracts/enums/material-mode.enum";
export type {
  ColorToken,
  FontFamilies,
  FontFamilyName,
  MaterialLevelToken,
  ModeShare,
  MotionToken,
  ShadowToken,
  Theme,
  ThemeColors,
  ThemeMaterials,
  ThemeRadius,
  ThemeShadows,
  TypographyToken,
} from "#contracts/types/theme.type";
