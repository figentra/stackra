/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/ai-mark` (AI mark).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** AI mark. */
export const FREE_AI_MARK: ComponentEntry = {
  slug: "ai-mark",
  tier: "free",
  category: "ai",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "AiMark",
  parts: ["AiMark"],
  hero: {},
  examples: [
    { id: "kinds", card: true },
    { id: "shown", platforms: ["native"] },
    { id: "sizes", platforms: ["native"] },
  ],
  related: [],
  tokens: ["color.accent", "color.surface", "motion.duration"],
  keywords: ["ai", "generated", "label", "sparkle"],
};
