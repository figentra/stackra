/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/transfer-list` (TransferList).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (wave D, owner approval 2026-10-30).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The TransferList entry of the component registry. */
export const FREE_TRANSFER_LIST: ComponentEntry = {
  slug: "transfer-list",
  tier: "free",
  category: "selection",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "TransferList",
  parts: ["TransferList"],
  // HeroUI has no transfer list; this one is two house Listboxes with filters.
  hero: {},
  examples: [
    { id: "basics", card: true, minHeight: 460 },
    { id: "export-columns", platforms: ["react"], minHeight: 460 },
  ],
  related: ["free/listbox", "free/multi-select", "free/checkbox-group"],
  tokens: ["color.accent", "color.separator", "radius.container"],
  haptics: [{ event: "select", style: "selection" }],
  keywords: ["transfer list", "dual list", "shuttle", "move items", "pick list"],
  status: "new",
};
