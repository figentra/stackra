/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/highlight` (Highlight).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (wave A, owner request 2026-10-29).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Highlight entry of the component registry. */
export const FREE_HIGHLIGHT: ComponentEntry = {
  slug: "highlight",
  tier: "free",
  category: "data_display",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "Highlight",
  parts: ["Highlight"],
  hero: {},
  examples: [{ id: "search", card: true }, { id: "terms" }, { id: "arabic", platforms: ["react"] }],
  related: ["free/search-field", "free/command-palette", "free/list"],
  tokens: ["color.warning"],
  keywords: ["highlight", "search match", "mark", "find", "arabic search", "diacritics"],
  status: "new",
};
