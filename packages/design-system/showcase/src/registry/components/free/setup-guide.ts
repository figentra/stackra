/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/setup-guide` (Setup guide).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Setup guide. */
export const FREE_SETUP_GUIDE: ComponentEntry = {
  slug: "setup-guide",
  tier: "free",
  category: "feedback_and_status",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "SetupGuide",
  parts: ["SetupGuide"],
  hero: {},
  examples: [{ id: "store-setup", card: true }, { id: "pos-onboarding" }, { id: "complete" }],
  related: ["free/progress-bar", "free/checkbox", "free/card"],
  tokens: ["color.success", "color.accent", "radius.base", "motion.reveal"],
  haptics: [
    { event: "tick", style: "selection" },
    { event: "complete", style: "success" },
  ],
  keywords: ["onboarding", "checklist", "setup", "getting started"],
};
