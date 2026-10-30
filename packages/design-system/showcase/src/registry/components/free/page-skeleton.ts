/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/page-skeleton` (Page skeleton).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Page skeleton. */
export const FREE_PAGE_SKELETON: ComponentEntry = {
  slug: "page-skeleton",
  tier: "free",
  category: "feedback_and_status",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "PageSkeleton",
  parts: ["PageSkeleton"],
  hero: {},
  examples: [{ id: "layouts", card: true }, { id: "animations" }, { id: "live" }],
  related: ["free/progress-bar", "free/error-state", "free/progress-circle"],
  tokens: ["color.success", "color.warning", "color.danger"],
  haptics: [{ event: "done", style: "success" }],
  keywords: ["loading", "placeholder", "shimmer"],
};
