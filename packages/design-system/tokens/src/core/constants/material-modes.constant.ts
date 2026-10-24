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

/** How one mode moves the material away from the theme's `glass` values. */
export interface MaterialModeFactors {
  /** Multiplies every level's fill share. */
  readonly fillScale: number;
  /** The least fill share any level may have; 1 makes every level opaque. */
  readonly fillFloor: number;
  /** Multiplies every level's blur radius; 0 turns the blur off. */
  readonly blurScale: number;
  /** Multiplies every level's saturation factor. */
  readonly saturationScale: number;
  /** The backdrop `brightness()` factor. */
  readonly brightness: number;
  /** How much white the sheen along the top inside edge carries, 0 to 1. */
  readonly sheen: number;
}

/**
 * The material modes' factors. `liquid` thins the fill and lifts the backdrop (more saturation and a little
 * brightness), as a lens would, and adds the sheen; it draws no refraction, which costs a filter pass per frame and
 * breaks text behind it on most browsers.
 */
export const MATERIAL_MODES: Readonly<Record<MaterialMode, MaterialModeFactors>> = Object.freeze({
  solid: {
    fillScale: 1,
    fillFloor: 1,
    blurScale: 0,
    saturationScale: 1,
    brightness: 1,
    sheen: 0,
  },
  frosted: {
    fillScale: 1,
    fillFloor: 0.88,
    blurScale: 1.6,
    saturationScale: 0.85,
    brightness: 1,
    sheen: 0,
  },
  glass: {
    fillScale: 1,
    fillFloor: 0,
    blurScale: 1,
    saturationScale: 1,
    brightness: 1,
    sheen: 0,
  },
  liquid: {
    fillScale: 0.8,
    fillFloor: 0,
    blurScale: 1.2,
    saturationScale: 1.25,
    brightness: 1.06,
    sheen: 0.22,
  },
});
