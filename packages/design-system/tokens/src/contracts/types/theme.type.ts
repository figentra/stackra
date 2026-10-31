/**
 * Stackra file contract:
 * Purpose: the token schema of the Stackra Design System: a Theme and its parts (colour roles and palette for light
 *          and dark, font families, typography and the utility type scale, spacing and layout, radius, shadows, motion
 *          and the glass material). A product brings its own brand as a Theme; the default is the stackra theme.
 * Boundary: types only. Every key below `palette`, `typography`, `spacing`, `radius.steps`, `motion` and the
 *          `typeScale` and `layout` records is a kebab-case token name and becomes part of a CSS custom property name.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (Stackra Design System); ADR 0231 (design tokens: CSS property form).
 */
import type { ColorToken } from "#contracts/types/color-token.type";
import type { FontFamilies } from "#contracts/types/font-families.type";
import type { MotionToken } from "#contracts/types/motion-token.type";
import type { HapticPattern } from "#contracts/enums/haptic-pattern.enum";
import type { ThemeAccessibility } from "#contracts/types/theme-accessibility.type";
import type { ThemeAnimation } from "#contracts/types/theme-animation.type";
import type { ThemeColors } from "#contracts/types/theme-colors.type";
import type { ThemeLayout } from "#contracts/types/theme-layout.type";
import type { ThemeLocale } from "#contracts/types/theme-locale.type";
import type { ThemeMaterials } from "#contracts/types/theme-materials.type";
import type { ThemeRadius } from "#contracts/types/theme-radius.type";
import type { ThemeShadows } from "#contracts/types/theme-shadows.type";
import type { ThemeTypeScale } from "#contracts/types/theme-type-scale.type";
import type { TypographyToken } from "#contracts/types/typography-token.type";

/** A complete theme: everything the web and native renderers need. */
export interface Theme {
  /** The theme name, kebab-case, for example `stackra`. */
  readonly name: string;
  /** The semantic colour roles. */
  readonly colors: ThemeColors;
  /** Brand colours outside the roles, rendered on web only as `--<name>`; a name never repeats a role. */
  readonly palette: Readonly<Record<string, ColorToken>>;
  /** The font stacks, rendered as `--font-<name>`. */
  readonly fontFamily: FontFamilies;
  /** The text styles, rendered as `--<name>` (the `font` shorthand) and `--<name>-letter-spacing`. */
  readonly typography: Readonly<Record<string, TypographyToken>>;
  /** The utility type scale (text sizes, weights, tracking, leading), rendered as Tailwind's theme variables. */
  readonly typeScale: ThemeTypeScale;
  /** The spacing scale, rendered as `--space-<name>`. */
  readonly spacing: Readonly<Record<string, string>>;
  /** The size and structure knobs: density, control heights, edges, focus ring, sizes, stacking and regions. */
  readonly layout: ThemeLayout;
  /** The corner radii. */
  readonly radius: ThemeRadius;
  /** The surface, overlay, field, raised and pressed shadows. */
  readonly shadows: ThemeShadows;
  /** The motion steps, rendered as `--duration-<name>` and `--ease-<name>`. */
  readonly motion: Readonly<Record<string, MotionToken>>;
  /** The easings, springs, press scale and entrance distance (ADR 0501, the motion family). */
  readonly animation: ThemeAnimation;
  /**
   * The native touch feedback by kind (`selection`, `light`, `medium`, `success`, `warning`, `error`, and the
   * `impact` and `rigid` kinds), each an `expo-haptics` pattern; not rendered on the web.
   */
  readonly haptics: Readonly<Record<string, HapticPattern>>;
  /** The values the accessibility modes switch to: more contrast, text scales, the colour-blind-safe chart palette. */
  readonly accessibility: ThemeAccessibility;
  /** Direction and digits. */
  readonly locale: ThemeLocale;
  /** The glass material (ADR 0320), rendered as the `--material-*` properties and the `.material*` classes. */
  readonly materials: ThemeMaterials;
  /**
   * The icon stroke width on the 24px grid by the weight of the text beside the icon (`"400": 1.5`), rendered as
   * `--icon-stroke-<weight>`.
   */
  readonly iconStroke?: Readonly<Record<string, number>> | undefined;
}
