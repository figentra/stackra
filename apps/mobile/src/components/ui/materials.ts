/**
 * Stackra file contract:
 * Purpose: the material values of the design-system showcase (ADR 0320 decision 7): the three levels (the share of
 *          `surface` in the fill per scheme, the blur and the saturation), the edge and highlight, and the four
 *          document-level modes that adjust them, plus `resolveMaterial`, which gives one level's fill and blur in one
 *          mode and scheme.
 * Boundary: values and one pure function; `Glass` draws them.
 * Runtime: react-native
 * Governing contract: ADR 0320 (decision 7, the material system).
 */

// shortcut: a local mirror of the @stackra/tokens materials (PR #135, STA-424), which this branch does not have yet;
// swap to `ThemeMaterials`, `MaterialLevel` and `MaterialMode` from `@stackra/tokens/contracts` and `MATERIAL_MODES`
// from `@stackra/tokens` once #135 reaches this branch, and delete this file.

/** How much of the surface a material layer carries. */
export type MaterialLevel = "thin" | "regular" | "thick";

/** How the whole document draws its materials. */
export type MaterialMode = "solid" | "frosted" | "glass" | "liquid";

/** A value per colour scheme. */
interface PerScheme {
  readonly light: number;
  readonly dark: number;
}

/** The levels: the fill is the share of `surface`, the blur a radius in points, the saturation a factor. */
export const MATERIAL_LEVELS: Readonly<
  Record<MaterialLevel, { fill: PerScheme; blur: number; saturation: number }>
> = {
  thin: { fill: { light: 0.6, dark: 0.62 }, blur: 12, saturation: 1.6 },
  regular: { fill: { light: 0.78, dark: 0.8 }, blur: 20, saturation: 1.6 },
  thick: { fill: { light: 0.9, dark: 0.92 }, blur: 28, saturation: 1.4 },
};

/** The hairline edge of every material, a share of `foreground`. */
export const MATERIAL_EDGE: PerScheme = { light: 0.1, dark: 0.12 };
/** The top highlight of every material, a share of white. */
export const MATERIAL_HIGHLIGHT: PerScheme = { light: 0.7, dark: 0.09 };

/** How each mode adjusts the levels; `solid` is opaque and is also the reduced-transparency fallback. */
export const MATERIAL_MODES: Readonly<
  Record<
    MaterialMode,
    {
      fillFloor?: number;
      fillScale?: number;
      blurScale?: number;
      saturationScale?: number;
      brightness?: number;
      sheen?: number;
    }
  >
> = {
  solid: { fillFloor: 1, blurScale: 0 },
  frosted: { fillFloor: 0.88, blurScale: 1.6 },
  glass: {},
  liquid: { fillScale: 0.8, blurScale: 1.2, saturationScale: 1.25, brightness: 1.06, sheen: 0.22 },
};

/** One level's fill (share of `surface`, 0 to 1) and blur (points) in a mode and a colour scheme. */
export function resolveMaterial(
  level: MaterialLevel,
  mode: MaterialMode,
  scheme: "light" | "dark",
) {
  const base = MATERIAL_LEVELS[level];
  const { fillFloor = 0, fillScale = 1, blurScale = 1 } = MATERIAL_MODES[mode];
  return {
    fill: Math.min(1, Math.max(fillFloor, base.fill[scheme] * fillScale)),
    blur: base.blur * blurScale,
  };
}
