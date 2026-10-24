/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./contracts` entry of @stackra/tokens, which has two public files, until
 *          `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { ColorRole } from "#contracts/enums/color-role.enum";
export type { MotionTiming } from "#contracts/types/motion-timing.type";
export type {
  ColorToken,
  FontFamilies,
  FontFamilyName,
  MotionToken,
  ShadowToken,
  Theme,
  ThemeColors,
  ThemeRadius,
  ThemeShadows,
  TypographyToken,
} from "#contracts/types/theme.type";
