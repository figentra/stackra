/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/shimmer` (Shimmer).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (wave D, owner approval 2026-10-30).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Shimmer entry of the component registry. */
export const FREE_SHIMMER: ComponentEntry = {
  slug: "shimmer",
  tier: "free",
  category: "ai",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "Shimmer",
  parts: ["Shimmer"],
  // HeroUI has no text shimmer; the text kind is a gradient sweep, the block kind composes the Skeleton.
  hero: {},
  examples: [{ id: "thinking", card: true }, { id: "block" }],
  related: ["free/skeleton", "free/ai-mark"],
  tokens: ["color.muted", "motion.duration"],
  keywords: ["ai", "loading", "thinking", "shimmer", "skeleton", "placeholder"],
  status: "new",
};
