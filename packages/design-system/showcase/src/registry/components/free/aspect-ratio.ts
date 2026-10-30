/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/aspect-ratio` (AspectRatio).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (wave D, owner approval 2026-10-30).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The AspectRatio entry of the component registry. */
export const FREE_ASPECT_RATIO: ComponentEntry = {
  slug: "aspect-ratio",
  tier: "free",
  category: "layout",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "AspectRatio",
  parts: ["AspectRatio"],
  // CSS aspect-ratio on web and the aspectRatio style on native.
  hero: {},
  examples: [{ id: "product-photo", card: true }, { id: "video" }],
  related: ["free/layout", "free/thumbnail", "free/gallery"],
  tokens: [],
  keywords: ["aspect ratio", "ratio", "16:9", "square", "media", "image box"],
  status: "new",
};
