/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/inline-select` (Inline select).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; wave 3a forms and pickers (owner approval 2026-10-28).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Inline select entry of the component registry. */
export const FREE_INLINE_SELECT: ComponentEntry = {
  slug: "inline-select",
  tier: "free",
  category: "selection",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "InlineSelect",
  parts: ["InlineSelect"],
  hero: {},
  examples: [{ id: "basics", card: true }],
  related: ["free/select", "free/native-select"],
  tokens: ["color.accent"],
  keywords: ["inline", "select", "sentence", "dropdown"],
  status: "new",
};
