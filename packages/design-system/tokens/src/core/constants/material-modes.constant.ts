/**
 * Stackra file contract:
 * Purpose: what each material mode does to the theme's levels, as factors the web renderer writes once on
 *          `[data-material="…"]`: every level's fill is scaled and floored, its blur and saturation scaled, the
 *          backdrop brightened, and a sheen of white laid along the top inside edge. `glass` is the theme as written.
 * Boundary: data only; the factors are the system's, not a theme's, so every theme moves the same way between modes.
 *          `solid` is also what reduced transparency, more contrast and a browser without backdrop filters get.
 * Runtime: isomorphic
 * Governing contract: ADR 0320 (the glass material).
 */
import type { MaterialMode } from "#contracts/enums/material-mode.enum";
import type { MaterialModeFactors } from "#contracts/types/material-mode-factors.type";

/**
 * The material modes' factors. `liquid` thins the fill and lifts the backdrop (more saturation and a little
 * brightness), as a lens would, and adds the sheen; it draws no refraction, which costs a filter pass per frame and
 * breaks text behind it on most browsers.
 */
export const MATERIAL_MODES: Readonly<Record<MaterialMode, MaterialModeFactors>> = Object.freeze({
  solid: {
    fillScale: 1,
    fillFloor: 1,
    thickFloor: 1,
    blurScale: 0,
    saturationScale: 1,
    brightness: 1,
    sheen: 0,
    specularScale: 0,
    clearFloor: 0.8,
  },
  frosted: {
    fillScale: 1,
    fillFloor: 0.88,
    thickFloor: 0,
    blurScale: 1.6,
    saturationScale: 0.85,
    brightness: 1,
    sheen: 0,
    specularScale: 0,
    clearFloor: 0.6,
  },
  glass: {
    fillScale: 1,
    fillFloor: 0,
    thickFloor: 0,
    blurScale: 1,
    saturationScale: 1,
    brightness: 1,
    sheen: 0,
    specularScale: 1,
    clearFloor: 0,
  },
  liquid: {
    fillScale: 0.8,
    fillFloor: 0,
    // Its thick fill (0.72) leaves muted text at 3.15:1 over black on the light scheme, so the thick level is solid.
    thickFloor: 1,
    blurScale: 1.2,
    saturationScale: 1.25,
    brightness: 1.06,
    // 22% white on the stackra light scheme (rim light 0.7), under 3% on its dark one (0.09).
    sheen: 0.31,
    specularScale: 1.3,
    clearFloor: 0,
  },
});
