/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/flip-card` (Flip card).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; wave 3c mobile interactions (owner approval
 *          2026-10-28).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Flip card entry of the component registry. */
export const FREE_FLIP_CARD: ComponentEntry = {
  slug: "flip-card",
  tier: "free",
  category: "data_display",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "FlipCard",
  parts: ["FlipCard"],
  hero: {},
  examples: [{ id: "basics", card: true }],
  related: ["free/card", "free/surface"],
  tokens: ["color.surface", "radius.base", "motion.duration"],
  keywords: ["flip", "card", "turn over", "back side"],
  status: "new",
};
