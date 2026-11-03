/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/dither-art` (DitherArt).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-2041 (the Stackra landing, W4).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The DitherArt entry of the component registry. */
export const FREE_DITHER_ART: ComponentEntry = {
  slug: "dither-art",
  tier: "free",
  category: "foundations",
  platforms: ["react"],
  packageName: "@stackra/ui",
  exportName: "DitherArt",
  parts: ["DitherArt"],
  // HeroUI has no generative art; this is the brand kit's field code on a 2D canvas.
  hero: {},
  examples: [{ id: "strata", card: true }, { id: "core" }],
  related: ["free/frame", "free/bento-card"],
  tokens: ["color.accent", "color.core", "color.background"],
  keywords: [
    "brand pattern",
    "dither",
    "bayer",
    "generative art",
    "strata",
    "hero art",
    "background art",
  ],
  status: "new",
};
