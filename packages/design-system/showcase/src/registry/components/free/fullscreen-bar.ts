/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/fullscreen-bar` (Fullscreen bar): the exit and title bar of POS, KDS, kiosk
 *          and editor full-screen modes.
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; GAPS.md row 32.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Fullscreen bar. */
export const FREE_FULLSCREEN_BAR: ComponentEntry = {
  slug: "fullscreen-bar",
  tier: "free",
  category: "layout",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "FullscreenBar",
  parts: ["FullscreenBar"],
  hero: {},
  examples: [{ id: "register", card: true }, { id: "locked" }, { id: "pinned" }],
  related: ["free/app-header", "free/screen", "free/navigation-header"],
  tokens: ["color.surface", "color.separator", "motion.base"],
  haptics: [{ event: "exit", style: "impact" }],
  keywords: ["fullscreen", "kiosk", "pos", "kds", "exit", "immersive"],
};
