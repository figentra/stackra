/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/press-feedback` (Press feedback).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; wave 3c mobile interactions (owner approval
 *          2026-10-28).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Press feedback entry of the component registry. */
export const FREE_PRESS_FEEDBACK: ComponentEntry = {
  slug: "press-feedback",
  tier: "free",
  category: "foundations",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "PressFeedback",
  parts: ["PressFeedback"],
  hero: {},
  examples: [{ id: "basics", card: true }],
  related: ["free/card", "free/button"],
  tokens: ["motion.duration", "color.surface"],
  haptics: [{ event: "press", style: "impact" }],
  keywords: ["press", "tap", "ripple", "scale", "highlight"],
  status: "new",
};
