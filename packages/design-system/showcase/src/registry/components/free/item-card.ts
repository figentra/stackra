/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/item-card` (Item card).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; wave 3a forms and pickers (owner approval 2026-10-28).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Item card. */
export const FREE_ITEM_CARD: ComponentEntry = {
  slug: "item-card",
  tier: "free",
  category: "data_display",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "ItemCard",
  parts: ["ItemCard", "ItemCardGroup"],
  hero: {},
  examples: [{ id: "basics", card: true }],
  related: ["free/settings-cell", "free/list"],
  tokens: ["color.surface", "radius.surface"],
  keywords: ["card", "row", "list", "grouped"],
  status: "new",
};
