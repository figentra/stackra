/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/view-stack` (ViewStack).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** ViewStack. */
export const FREE_VIEW_STACK: ComponentEntry = {
  slug: "view-stack",
  tier: "free",
  category: "navigation",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "ViewStack",
  parts: ["ViewStack", "ViewStack.View", "ViewStack.Back", "useViewStack"],
  hero: {},
  examples: [{ id: "transitions", card: true }],
  related: ["free/navigation-list", "free/navigation-header", "free/tabs"],
  tokens: [],
  keywords: ["drill-down", "stack", "push", "navigation", "transition"],
  status: "new",
};
