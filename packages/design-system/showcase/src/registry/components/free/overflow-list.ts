/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/overflow-list` (Overflow list).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; design-system gap inventory (2026-10-28).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Overflow list. */
export const FREE_OVERFLOW_LIST: ComponentEntry = {
  slug: "overflow-list",
  tier: "free",
  category: "data_display",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "OverflowList",
  parts: ["OverflowList"],
  hero: {},
  examples: [{ id: "tags", card: true }, { id: "roles" }, { id: "channels" }],
  related: ["free/chip", "free/tag-group", "free/tooltip"],
  tokens: ["color.surface", "radius.base"],
  keywords: ["truncate", "more", "overflow", "chips"],
};
