/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/morph-button` (Morph button).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; wave 3c mobile interactions (owner approval
 *          2026-10-28).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Morph button entry of the component registry. */
export const FREE_MORPH_BUTTON: ComponentEntry = {
  slug: "morph-button",
  tier: "free",
  category: "actions",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "MorphButton",
  parts: ["MorphButton"],
  hero: {},
  examples: [{ id: "basics", card: true }],
  related: ["free/button", "free/inline-loading"],
  tokens: ["color.accent", "color.danger", "motion.duration"],
  keywords: ["loading button", "success", "submit", "morph"],
  status: "new",
};
