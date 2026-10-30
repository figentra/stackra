/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/thumbnail` (Thumbnail).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; design-system gap inventory row 12.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Thumbnail. */
export const FREE_THUMBNAIL: ComponentEntry = {
  slug: "thumbnail",
  tier: "free",
  category: "data_display",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "Thumbnail",
  parts: ["Thumbnail"],
  // HeroUI has no resource image; Avatar is its nearest and is round and people-oriented.
  hero: {},
  examples: [
    { id: "sizes", card: true },
    { id: "fallbacks" },
    { id: "menu-items" },
    { id: "blur-up" },
  ],
  related: ["free/avatar", "free/table", "free/list"],
  tokens: ["color.default", "radius.lg", "motion.base"],
  keywords: ["image", "thumbnail", "product", "photo", "placeholder"],
};
