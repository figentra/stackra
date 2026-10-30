/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/foundations` (Foundations).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Foundations entry of the component registry. */
export const FREE_FOUNDATIONS: ComponentEntry = {
  slug: "foundations",
  tier: "free",
  category: "foundations",
  platforms: ["react"],
  packageName: "@stackra/ui",
  exportName: "DesignSystemProvider",
  parts: ["DesignSystemProvider"],
  hero: {},
  examples: [
    { id: "colors", card: true },
    { id: "typography" },
    { id: "spacing" },
    { id: "radius" },
    { id: "shadows" },
    { id: "motion" },
  ],
  related: ["free/icon", "free/reveal", "free/typography"],
  tokens: ["color.accent", "color.background", "radius.base", "motion.duration"],
  keywords: ["tokens", "colours", "theme", "contrast"],
};
