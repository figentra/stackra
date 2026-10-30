/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/inline-edit` (Inline edit), built from the P1 gap list (owner decision 2026-10-28).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Inline edit. */
export const FREE_INLINE_EDIT: ComponentEntry = {
  slug: "inline-edit",
  tier: "free",
  category: "inputs_and_forms",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "InlineEdit",
  parts: ["InlineEdit"],
  hero: {},
  examples: [{ id: "basics", card: true }, { id: "validation" }, { id: "states" }],
  related: ["free/form-section", "free/input-group", "free/form-field"],
  tokens: ["color.field", "radius.field", "color.focus"],
  haptics: [
    { event: "save", style: "success" },
    { event: "invalid", style: "error" },
  ],
  keywords: ["edit in place", "inline", "rename"],
};
