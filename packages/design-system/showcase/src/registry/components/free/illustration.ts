/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/illustration` (Illustration).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-2041 (the Stackra landing, the art decision).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Illustration entry of the component registry. */
export const FREE_ILLUSTRATION: ComponentEntry = {
  slug: "illustration",
  tier: "free",
  category: "foundations",
  platforms: ["react"],
  packageName: "@stackra/ui",
  exportName: "Illustration",
  parts: ["Illustration"],
  // HeroUI has no themed illustration; this stacks four single-tone mask layers over the colour roles.
  hero: {},
  examples: [{ id: "engine", card: true }, { id: "decorative" }],
  related: ["free/dither-art", "free/blueprint-section", "free/frame"],
  tokens: ["color.background", "color.stk-tile-line", "color.accent", "color.core"],
  keywords: ["illustration", "art", "drawing", "mask", "svg", "landing", "marketing", "theme"],
  status: "new",
};
