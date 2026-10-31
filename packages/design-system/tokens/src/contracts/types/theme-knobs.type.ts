/**
 * Stackra file contract:
 * Purpose: the few inputs a theme is derived from (the Theme Studio's controls): an accent colour, the hue and chroma
 *          the neutrals lean to, the base radius and pill controls, the density, the field style, the corner shape,
 *          the Latin and Arabic font stacks, the glass material's levels and the
 *          theme's name. `deriveTheme` turns them and a base theme into a full theme; every knob left out keeps the
 *          base's value.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (Stackra Design System); ADR 0320 (the glass material); ADR 0340 (decision 4).
 */
import type { MaterialLevel } from "#contracts/enums/material-level.enum";

/** The inputs of `deriveTheme`; each one left out keeps the base theme's value. */
export interface ThemeKnobs {
  /** The derived theme's name, kebab-case. */
  readonly name?: string | undefined;
  /**
   * An accent colour by its oklch hue (0 to 360) and chroma (0 to 0.37), at the base accent's lightness in each scheme
   * (`deriveAccent`); `null` keeps the base's accent.
   */
  readonly accent?: { readonly hue: number; readonly chroma: number } | null | undefined;
  /** The hue the neutral roles lean to, 0 to 360. */
  readonly neutralHue?: number | undefined;
  /** How far the neutral roles lean to it, an oklch chroma from 0 to 0.03. */
  readonly neutralChroma?: number | undefined;
  /** The base corner radius in px. */
  readonly radius?: number | undefined;
  /** Whether buttons, segments and tabs are pills (`radius.steps.control` set to the pill), whatever the base radius. */
  readonly pillControls?: boolean | undefined;
  /** The spacing unit in px, the density knob (4 is Tailwind's; 3.6 compact, 4.4 spacious). */
  readonly spacing?: number | undefined;
  /** A field's edge: a 1px `bordered` line, or `lifted` with no line, set off by the field shadow. */
  readonly fieldStyle?: "bordered" | "lifted" | undefined;
  /** The corner shape: `round`, or `squircle` where the platform draws it. */
  readonly cornerShape?: "round" | "squircle" | undefined;
  /** How far the neutrals tint toward the accent's hue, 0 (none) to 1 (an oklch chroma of 0.03). */
  readonly neutralTint?: number | undefined;
  /** The vibrant palette: soft foregrounds in a more saturated mix. */
  readonly vibrant?: boolean | undefined;
  /** A multiplier on every font size (0.6 to 1.4). */
  readonly fontScale?: number | undefined;
  /** A multiplier on every unitless line height (0.8 to 1.5). */
  readonly lineHeight?: number | undefined;
  /** Letter spacing added to every text style and step, in em (-0.05 to 0.1). */
  readonly letterSpacing?: number | undefined;
  /** The forms radius: the field radius as a multiple of the base radius (0 to 3). */
  readonly formsRadius?: number | undefined;
  /** The strength of each role's shadow. */
  readonly shadows?:
    | {
        readonly [Role in "surface" | "overlay" | "field"]?:
          | "none"
          | "subtle"
          | "medium"
          | "strong"
          | undefined;
      }
    | undefined;
  /** A field's edge width in px (0 to 3); `fieldStyle` is its 0 or 1 shorthand. */
  readonly fieldBorderWidth?: number | undefined;
  /** A disabled control's opacity (0.2 to 0.8). */
  readonly disabledOpacity?: number | undefined;
  /** Whether interactive controls show the pointer cursor. */
  readonly cursorPointer?: boolean | undefined;
  /** How a skeleton loads. */
  readonly skeleton?: "shimmer" | "pulse" | "none" | undefined;
  /** The global animations switch. */
  readonly animations?: boolean | undefined;
  /** The Latin font stack, a CSS `font-family` list. */
  readonly fontSans?: string | undefined;
  /** The Arabic font stack, a CSS `font-family` list. */
  readonly fontArabic?: string | undefined;
  /**
   * The glass material's levels: a level's fill share of the surface (0 to 1, set in both schemes) and its backdrop
   * blur in px; a level or a part left out keeps the base's.
   */
  readonly materials?:
    | {
        readonly [Level in MaterialLevel]?:
          | { readonly fill?: number | undefined; readonly blur?: number | undefined }
          | undefined;
      }
    | undefined;
}
