/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/split-view` (Split view).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; wave 3c mobile interactions (owner approval
 *          2026-10-28).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Split view entry of the component registry. */
export const FREE_SPLIT_VIEW: ComponentEntry = {
  slug: "split-view",
  tier: "free",
  category: "layout",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "SplitView",
  parts: ["SplitView"],
  hero: {},
  examples: [
    { id: "basics", card: true },
    { id: "resizable", platforms: ["react"] },
  ],
  related: ["free/two-column-layout", "free/list"],
  tokens: ["color.border", "color.surface"],
  keywords: ["master detail", "list detail", "tablet", "two panes"],
  status: "new",
};
