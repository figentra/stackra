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
import type { ColorRole } from "#contracts/enums/color-role.enum";
import type { MaterialLevel } from "#contracts/enums/material-level.enum";

/** One colour in both modes: a CSS colour for each, and its sRGB hex for platforms that take hex. */
export interface ColorToken {
  /** The CSS colour (oklch) in the light mode. */
  readonly light: string;
  /** The CSS colour (oklch) in the dark mode. */
  readonly dark: string;
  /** The sRGB hex equivalent of `light`, `#RRGGBB` or `#RRGGBBAA`. */
  readonly hexLight: string;
  /** The sRGB hex equivalent of `dark`, `#RRGGBB` or `#RRGGBBAA`. */
  readonly hexDark: string;
}

/** A colour for every semantic role; HeroUI components read these. */
export type ThemeColors = { readonly [Role in ColorRole]: ColorToken };

/** The three font stacks, each a CSS `font-family` list. */
export interface FontFamilies {
  /** The stack for Latin text. */
  readonly sans: string;
  /** The stack for code, labels and figures. */
  readonly mono: string;
  /** The stack for Arabic (RTL) text. */
  readonly arabic: string;
}

/** The name of one font stack. */
export type FontFamilyName = keyof FontFamilies;

/** One text style. */
export interface TypographyToken {
  /** The CSS `font-weight`, 100 to 900. */
  readonly weight: number;
  /** The CSS `font-size`. */
  readonly size: string;
  /** The CSS `line-height`. */
  readonly lineHeight: string;
  /** The font stack it is set in. */
  readonly family: FontFamilyName;
  /** The CSS `letter-spacing`. */
  readonly letterSpacing: string;
}

/** The corner radii. */
export interface ThemeRadius {
  /** The base radius, HeroUI's `--radius`. */
  readonly base: string;
  /** The form field radius, HeroUI's `--field-radius`. */
  readonly field: string;
  /** Further named radii, rendered as `--radius-<name>`. */
  readonly steps: Readonly<Record<string, string>>;
}

/** A CSS `box-shadow` for each mode. */
export interface ShadowToken {
  /** The shadow in the light mode. */
  readonly light: string;
  /** The shadow in the dark mode. */
  readonly dark: string;
}

/** The three HeroUI surface shadows. */
export interface ThemeShadows {
  /** Cards and other non-overlay surfaces, `--surface-shadow`. */
  readonly surface: ShadowToken;
  /** Popovers, dialogs and menus, `--overlay-shadow`. */
  readonly overlay: ShadowToken;
  /** Form fields, `--field-shadow`. */
  readonly field: ShadowToken;
}

/** One motion step. */
export interface MotionToken {
  /** The CSS transition duration. */
  readonly duration: string;
  /** The CSS timing function. */
  readonly easing: string;
}

/** A share from 0 to 1 for each mode. */
export interface ModeShare {
  /** The share in the light mode. */
  readonly light: number;
  /** The share in the dark mode. */
  readonly dark: number;
}

/** One thickness of the glass material, in the `glass` mode; the other modes scale it. */
export interface MaterialLevelToken {
  /** How much of the `surface` role the fill is, 0 (clear) to 1 (opaque). */
  readonly fill: ModeShare;
  /** The backdrop blur radius, a px length. */
  readonly blur: string;
  /** The backdrop `saturate()` factor; 1 leaves the colour as it is. */
  readonly saturation: number;
}

/** The glass material: its three levels and the light that runs along its edge. */
export interface ThemeMaterials {
  /** The levels, rendered as `--material-<level>-fill` and `--material-<level>-filter`. */
  readonly levels: { readonly [Level in MaterialLevel]: MaterialLevelToken };
  /** How much of `foreground` the hairline edge is, `--material-edge`. */
  readonly edge: ModeShare;
  /** How much of white the top rim light is, `--material-highlight`. */
  readonly highlight: ModeShare;
}

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
