/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/page-indicator` (PageIndicator).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (wave D, owner approval 2026-10-30).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The PageIndicator entry of the component registry. */
export const FREE_PAGE_INDICATOR: ComponentEntry = {
  slug: "page-indicator",
  tier: "free",
  category: "navigation",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "PageIndicator",
  parts: ["PageIndicator"],
  // The dots Carousel draws, as their own component.
  hero: {},
  examples: [{ id: "onboarding", card: true }, { id: "display-only" }],
  related: ["free/carousel", "free/pagination", "free/stepper"],
  tokens: ["color.focus", "motion.duration"],
  keywords: ["dots", "page dots", "pager", "carousel dots", "onboarding", "indicator"],
  status: "new",
};
