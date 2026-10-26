/**
 * Stackra file contract:
 * Purpose: the token schema of the Stackra Design System: a Theme and its parts (colour roles and palette for light
 *          and dark, font families, typography, spacing, radius, shadows, motion and the glass material). A product brings its own brand
 *          as a Theme; the default is the stackra theme.
 * Boundary: types only. Every key below `palette`, `typography`, `spacing`, `radius.steps` and `motion` is a
 *          kebab-case token name and becomes the CSS custom property name as written.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (Stackra Design System); ADR 0231 (design tokens: CSS property form).
 */
import type { ColorToken } from "#contracts/types/color-token.type";
import type { FontFamilies } from "#contracts/types/font-families.type";
import type { MotionToken } from "#contracts/types/motion-token.type";
import type { ThemeColors } from "#contracts/types/theme-colors.type";
import type { ThemeMaterials } from "#contracts/types/theme-materials.type";
import type { ThemeRadius } from "#contracts/types/theme-radius.type";
import type { ThemeShadows } from "#contracts/types/theme-shadows.type";
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
  /** The spacing scale, rendered as `--space-<name>`. */
  readonly spacing: Readonly<Record<string, string>>;
  /** The corner radii. */
  readonly radius: ThemeRadius;
  /** The surface, overlay and field shadows. */
  readonly shadows: ThemeShadows;
  /** The motion steps, rendered as `--duration-<name>` and `--ease-<name>`. */
  readonly motion: Readonly<Record<string, MotionToken>>;
  /** The glass material (ADR 0320), rendered as the `--material-*` properties and the `.material*` classes. */
  readonly materials: ThemeMaterials;
}
