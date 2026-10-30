/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/tag-input` (Tag input).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (wave A, owner request 2026-10-29).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Tag input. */
export const FREE_TAG_INPUT: ComponentEntry = {
  slug: "tag-input",
  tier: "free",
  category: "inputs_and_forms",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "TagInput",
  parts: ["TagInput"],
  hero: {},
  examples: [
    { id: "basics", card: true },
    { id: "emails" },
    { id: "arabic", platforms: ["react"] },
  ],
  related: ["free/tag-group", "free/multi-select", "free/text-field"],
  tokens: ["color.field", "color.danger", "radius.control"],
  keywords: ["tags", "chips", "tokens", "token field", "keywords", "emails", "paste"],
  status: "new",
};
