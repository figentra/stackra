/**
 * Stackra file contract:
 * Purpose: `ThemeAccessibility`, part of the token schema of the Stackra Design System (see `Theme`): the values the
 *          accessibility modes switch to: the colour roles under more contrast, the text scales a reader can pick and
 *          the colour-blind-safe chart palette.
 * Boundary: a type only. Reduced transparency needs no value here: it drops the glass material to its solid mode.
 * Runtime: isomorphic
 * Governing contract: ADR 0501 (tokens v2, accessibility modes); WCAG 2.2 SC 1.4.3, 1.4.4, 1.4.6, 1.4.11.
 */
import type { ColorRole } from "#contracts/enums/color-role.enum";
import type { ColorToken } from "#contracts/types/color-token.type";

/** The values the accessibility modes switch to. */
export interface ThemeAccessibility {
  /**
   * The roles that change under more contrast (`prefers-contrast: more` or `<html data-contrast="more">`); a role left
   * out keeps its colour.
   */
  readonly contrast: Readonly<Partial<Record<ColorRole, ColorToken>>>;
  /**
   * The web text scales by name (`large`: 1.125), from 1 to 3, set with `<html data-text-scale="<name>">`. Native
   * text follows Dynamic Type instead.
   */
  readonly textScales: Readonly<Record<string, number>>;
  /**
   * The colour-blind-safe categorical chart palette, `--chart-1` onwards under `[data-chart-palette="safe"]`: hues
   * told apart under protanopia, deuteranopia and tritanopia.
   */
  readonly chartSafe: readonly ColorToken[];
}
