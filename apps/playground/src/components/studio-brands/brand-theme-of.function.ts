/**
 * Stackra file contract:
 * Purpose: `brandThemeOf`: the built theme of a brand layer, built once per brand, so the same brand is the same
 *          theme object (the studio compares its base to it). A layer that names no theme is named after its brand,
 *          so the studio and the exports never call a brand's theme `stackra`.
 * Boundary: a cache over `buildBrandTheme`.
 * Runtime: browser
 * Governing contract: ADR 0340 (decision 2).
 */
import { STACKRA_THEME } from "@stackra/tokens";
import type { Theme } from "@stackra/tokens/contracts";

import { type BrandTheme, buildBrandTheme } from "#src/constants/brand-themes";

const BUILT = new Map<string, Theme>();

/** The theme `brand`'s layer makes over the Stackra base. */
export function brandThemeOf(brand: BrandTheme): Theme {
  const cached = BUILT.get(brand.id);
  if (cached) return cached;
  const layered = buildBrandTheme(brand.layer);
  const built = layered.name === STACKRA_THEME.name ? { ...layered, name: brand.id } : layered;
  BUILT.set(brand.id, built);
  return built;
}
