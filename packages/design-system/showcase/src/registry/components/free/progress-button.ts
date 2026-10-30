/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/progress-button` (Progress button).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; wave 3c mobile interactions (owner approval
 *          2026-10-28).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Progress button entry of the component registry. */
export const FREE_PROGRESS_BUTTON: ComponentEntry = {
  slug: "progress-button",
  tier: "free",
  category: "actions",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "ProgressButton",
  parts: ["ProgressButton"],
  hero: {},
  examples: [{ id: "basics", card: true }],
  related: ["free/button", "free/progress-bar"],
  tokens: ["color.accent", "motion.duration"],
  keywords: ["upload", "progress", "busy button"],
  status: "new",
};
