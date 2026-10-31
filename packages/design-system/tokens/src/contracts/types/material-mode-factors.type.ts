/**
 * Stackra file contract:
 * Purpose: `MaterialModeFactors`, how one material mode moves the glass material away from the theme's `glass`
 *          values; `MATERIAL_MODES` holds one per mode.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0320 (the glass material).
 */

/** How one mode moves the material away from the theme's `glass` values. */
export interface MaterialModeFactors {
  /** Multiplies every level's fill share. */
  readonly fillScale: number;
  /** The least fill share any level may have; 1 makes every level opaque. */
  readonly fillFloor: number;
  /**
   * The least fill share of the thick level, the one muted text sits on: 1 (solid) in a mode whose own thick fill
   * cannot hold muted text at 4.5:1 over the worst backdrops (ADR 0320 decision 4).
   */
  readonly thickFloor: number;
  /** Multiplies every level's blur radius; 0 turns the blur off. */
  readonly blurScale: number;
  /** Multiplies every level's saturation factor. */
  readonly saturationScale: number;
  /** The backdrop `brightness()` factor. */
  readonly brightness: number;
  /**
   * How strong the sheen along the top inside edge is, as a share of the theme's rim light (`materials.highlight`):
   * the sheen is the rim light spread down, so it is bright on a light scheme and faint on a dark one, where white
   * would wash out light text.
   */
  readonly sheen: number;
  /** Multiplies every level's specular rim and inner depth: 0 in the solid and frosted modes. */
  readonly specularScale: number;
  /**
   * The least dim of clear glass, the black plate under media controls: 0.80 in the solid mode (so under reduced
   * transparency too), which still reads as a plate over media.
   */
  readonly clearFloor: number;
}
