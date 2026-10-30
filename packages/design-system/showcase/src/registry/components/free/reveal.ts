/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/reveal` (Reveal).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Reveal. */
export const FREE_REVEAL: ComponentEntry = {
  slug: "reveal",
  tier: "free",
  category: "foundations",
  platforms: ["native"],
  packageName: "@stackra/ui",
  exportName: "Reveal",
  parts: ["Reveal"],
  hero: {},
  examples: [{ id: "single", card: true }, { id: "stagger" }, { id: "off" }, { id: "inside" }],
  related: ["free/icon", "free/typography", "free/foundations"],
  tokens: ["color.accent", "color.background", "radius.base", "motion.duration"],
  keywords: ["animation", "entrance", "fade"],
};
