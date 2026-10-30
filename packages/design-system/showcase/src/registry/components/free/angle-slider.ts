/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/angle-slider` (AngleSlider).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (wave D, owner approval 2026-10-30).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The AngleSlider entry of the component registry. */
export const FREE_ANGLE_SLIDER: ComponentEntry = {
  slug: "angle-slider",
  tier: "free",
  category: "inputs_and_forms",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "AngleSlider",
  parts: ["AngleSlider"],
  // HeroUI has no circular slider; this one is an SVG dial on both platforms.
  hero: {},
  examples: [{ id: "gradient", card: true }, { id: "rotation" }],
  related: ["free/slider", "free/color-picker", "free/number-field"],
  tokens: ["color.accent", "color.border"],
  keywords: ["angle", "rotation", "degrees", "dial", "gradient", "circular slider"],
  status: "new",
};
