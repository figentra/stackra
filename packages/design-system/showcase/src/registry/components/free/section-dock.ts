/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/section-dock` (SectionDock).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-2041 (the Stackra landing, blueprint primitives).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The SectionDock entry of the component registry. */
export const FREE_SECTION_DOCK: ComponentEntry = {
  slug: "section-dock",
  tier: "free",
  category: "layout",
  platforms: ["react"],
  packageName: "@stackra/ui",
  exportName: "SectionDock",
  parts: ["SectionDock"],
  // HeroUI has no scroll-spy dock; a toolbar-material bar of in-page links with a status line.
  hero: {},
  examples: [{ id: "dock", card: true }],
  related: ["free/blueprint-section", "free/toc-rail"],
  tokens: ["blueprint.dock-height", "blueprint.rule", "color.accent", "font.mono"],
  keywords: ["dock", "scroll spy", "section links", "status line", "in-page navigation", "landing"],
  status: "new",
};
