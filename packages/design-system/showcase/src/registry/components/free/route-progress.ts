/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/route-progress` (Route progress).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; gap inventory row 29 (owner approval 2026-10-28).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Route progress entry of the component registry. */
export const FREE_ROUTE_PROGRESS: ComponentEntry = {
  slug: "route-progress",
  tier: "free",
  category: "feedback_and_status",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "RouteProgress",
  parts: ["RouteProgress"],
  hero: {},
  examples: [{ id: "navigation", card: true }, { id: "pages" }, { id: "header" }],
  related: ["free/progress-bar", "free/page-skeleton", "free/spinner"],
  tokens: ["color.accent"],
  keywords: ["loading", "navigation", "progress", "top bar"],
};
