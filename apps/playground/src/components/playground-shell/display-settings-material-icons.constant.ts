/**
 * Stackra file contract:
 * Purpose: `MATERIAL_ICONS`: the icon of each material mode (ADR 0320) in the display settings and the command palette.
 * Boundary: data only; the choice's accessible name is its catalogue word.
 * Runtime: browser
 * Governing contract: ADR 0320; ADR 0305 (rule 12: one declaration per file).
 */
import type { MaterialMode } from "@stackra/tokens/contracts";

/** The icon of each material mode. */
export const MATERIAL_ICONS = {
  /** The icon of the solid material. */
  solid: "square",
  /** The icon of the frosted material. */
  frosted: "snowflake",
  /** The icon of the glass material. */
  glass: "layers",
  /** The icon of the liquid glass material. */
  liquid: "droplet",
} as const satisfies Record<MaterialMode, string>;
