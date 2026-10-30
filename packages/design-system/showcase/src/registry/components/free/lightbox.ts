/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/lightbox` (Lightbox).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (wave C: content and media).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Lightbox entry of the component registry. */
export const FREE_LIGHTBOX: ComponentEntry = {
  slug: "lightbox",
  tier: "free",
  category: "overlays",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "Lightbox",
  parts: ["Lightbox"],
  hero: {},
  examples: [{ id: "basic", card: true }],
  related: ["free/gallery", "free/carousel", "free/modal"],
  tokens: ["color.foreground", "radius.control"],
  keywords: ["lightbox", "image viewer", "photo", "zoom", "fullscreen", "gallery"],
  status: "new",
};
