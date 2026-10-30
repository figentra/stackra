/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/collection-engine` (Collection engine).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; data-collection plan (owner, 2026-10-29).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Collection engine entry of the component registry. */
export const FREE_COLLECTION_ENGINE: ComponentEntry = {
  slug: "collection-engine",
  tier: "free",
  category: "foundations",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "useCollection",
  parts: ["useCollection"],
  hero: {},
  examples: [
    { id: "headless", card: true, platforms: ["react"] },
    { id: "query", platforms: ["react"] },
  ],
  related: ["free/data-view", "free/data-table", "free/data-grid"],
  tokens: [],
  keywords: ["hook", "engine", "headless", "state", "query", "server", "persistence", "views"],
  status: "new",
};
