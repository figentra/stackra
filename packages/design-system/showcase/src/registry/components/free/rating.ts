/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/rating` (Rating).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (gap build, owner approval 2026-10-31).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Rating entry of the component registry. */
export const FREE_RATING: ComponentEntry = {
  slug: "rating",
  tier: "free",
  category: "inputs_and_forms",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "Rating",
  parts: ["Rating"],
  // HeroUI's free kits have no rating; it is a radio group of stars.
  hero: {},
  examples: [
    { id: "review", card: true },
    { id: "read-only" },
    { id: "sizes" },
    { id: "arabic", platforms: ["react"] },
  ],
  related: ["free/radio-group", "free/reaction-button", "free/meter"],
  tokens: ["color.warning", "color.muted", "motion.fast"],
  keywords: ["rating", "stars", "review", "score", "feedback"],
  status: "new",
};
