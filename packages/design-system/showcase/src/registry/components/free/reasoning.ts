/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/reasoning` (Reasoning).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (component gaps, owner approval
 *          2026-10-31).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Reasoning entry of the component registry. */
export const FREE_REASONING: ComponentEntry = {
  slug: "reasoning",
  tier: "free",
  category: "ai",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "Reasoning",
  parts: ["Reasoning"],
  // HeroUI has no reasoning trace; this one is our Disclosure and Shimmer.
  hero: {},
  examples: [{ id: "trace", card: true }, { id: "streaming" }],
  related: ["free/chat-message", "free/shimmer", "free/disclosure"],
  tokens: ["color.muted", "color.separator", "motion.duration"],
  keywords: ["ai", "reasoning", "chain of thought", "agent steps", "thinking", "trace"],
  status: "new",
};
