/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/image` (Image).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (gap build, owner approval 2026-10-31).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Image entry of the component registry. */
export const FREE_IMAGE: ComponentEntry = {
  slug: "image",
  tier: "free",
  category: "data_display",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "Image",
  parts: ["Image"],
  // HeroUI v3 and HeroUI Native have no image component.
  hero: {},
  examples: [{ id: "photo", card: true }, { id: "zoom" }, { id: "fallback" }],
  related: ["free/thumbnail", "free/lightbox", "free/gallery"],
  tokens: ["color.default", "color.muted", "motion.base"],
  keywords: ["image", "picture", "photo", "figure", "zoom", "placeholder"],
  status: "new",
};
