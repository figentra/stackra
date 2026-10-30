/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/coach-mark` (Coach mark): an onboarding tour with a spotlight cutout.
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; GAPS.md row 39.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Coach mark. */
export const FREE_COACH_MARK: ComponentEntry = {
  slug: "coach-mark",
  tier: "free",
  category: "overlays",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "CoachMark",
  parts: ["CoachMark"],
  hero: {},
  examples: [{ id: "pos", card: true }, { id: "admin" }, { id: "outcome" }],
  related: ["free/popover", "free/tooltip", "free/modal"],
  tokens: ["color.backdrop", "color.accent", "motion.base"],
  keywords: ["tour", "onboarding", "spotlight", "walkthrough", "hint"],
};
