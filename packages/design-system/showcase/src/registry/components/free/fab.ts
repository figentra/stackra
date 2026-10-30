/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/fab` (Floating action button).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; wave 3c mobile interactions (owner approval
 *          2026-10-28).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Floating action button. */
export const FREE_FAB: ComponentEntry = {
  slug: "fab",
  tier: "free",
  category: "actions",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "Fab",
  parts: ["Fab"],
  hero: {},
  examples: [
    { id: "basics", card: true },
    { id: "speed-dial" },
    { id: "toast", platforms: ["react"] },
  ],
  related: ["free/button", "free/icon-button", "free/action-menu"],
  tokens: ["color.accent", "radius.full", "motion.duration"],
  haptics: [{ event: "press", style: "impact" }],
  keywords: ["fab", "floating button", "speed dial", "primary action"],
  status: "new",
};
