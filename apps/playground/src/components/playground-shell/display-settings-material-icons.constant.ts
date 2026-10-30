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
  solid: "square",
  frosted: "snowflake",
  glass: "layers",
  liquid: "droplet",
} as const satisfies Record<MaterialMode, string>;
