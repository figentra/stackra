/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/gallery` (Gallery).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (wave C: content and media).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Gallery entry of the component registry. */
export const FREE_GALLERY: ComponentEntry = {
  slug: "gallery",
  tier: "free",
  category: "data_display",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "Gallery",
  parts: ["Gallery"],
  hero: {},
  examples: [{ id: "grid", card: true }, { id: "masonry" }],
  related: ["free/lightbox", "free/carousel", "free/thumbnail"],
  tokens: ["color.default", "radius.control"],
  keywords: ["gallery", "masonry", "photos", "images", "grid", "portfolio"],
  status: "new",
};
