/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/screen` (Screen).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Screen. */
export const FREE_SCREEN: ComponentEntry = {
  slug: "screen",
  tier: "free",
  category: "layout",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "Screen",
  parts: ["Screen"],
  hero: {},
  examples: [{ id: "edges", card: true }, { id: "scrolling" }, { id: "arabic" }, { id: "live" }],
  related: ["free/page-header", "free/section", "free/app-shell"],
  tokens: ["color.background", "color.surface", "spacing.page"],
  keywords: ["page", "screen", "layout"],
};
