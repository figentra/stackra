/**
 * Stackra file contract:
 * Purpose: one material mode's factors as the CSS custom properties the material's fills and filters read: the fill
 *          scale and floor, the blur and saturation scales, the backdrop brightness and the sheen.
 * Boundary: a pure function from a mode to property names (with their leading `--`) and values.
 * Runtime: isomorphic
 * Governing contract: ADR 0320 (the glass material).
 */
import type { MaterialMode } from "#contracts/enums/material-mode.enum";
import { MATERIAL_MODES } from "#core/constants/material-modes.constant";

/** The custom properties of `mode`'s factors, for a `[data-material]` block, a fallback or the `:root` default. */
export function materialModeVariables(mode: MaterialMode): Readonly<Record<string, string>> {
  const factors = MATERIAL_MODES[mode];
  return {
    "--material-fill-scale": String(factors.fillScale),
    "--material-fill-floor": String(factors.fillFloor),
    "--material-blur-scale": String(factors.blurScale),
    "--material-saturate-scale": String(factors.saturationScale),
    "--material-brightness": String(factors.brightness),
    "--material-sheen": String(factors.sheen),
  };
}
