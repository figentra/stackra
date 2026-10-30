/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/carousel` (Carousel).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (wave 3b: data and dashboard).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Carousel entry of the component registry. */
export const FREE_CAROUSEL: ComponentEntry = {
  slug: "carousel",
  tier: "free",
  category: "data_display",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "Carousel",
  parts: ["Carousel"],
  hero: {},
  examples: [{ id: "offers", card: true }, { id: "thumbnails" }],
  related: ["free/card", "free/thumbnail", "free/gallery"],
  tokens: ["color.foreground", "color.default", "radius.xl"],
  keywords: ["carousel", "slider", "slides", "gallery", "swipe"],
  status: "new",
};
