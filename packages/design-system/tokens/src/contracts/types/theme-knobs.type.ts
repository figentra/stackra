/**
 * Stackra file contract:
 * Purpose: the few inputs a theme is derived from (the Theme Studio's controls): an accent colour, the hue and chroma
 *          the neutrals lean to, the base radius, the Latin and Arabic font stacks, the glass material's levels and the
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
