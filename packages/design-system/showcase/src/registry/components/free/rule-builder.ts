/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/rule-builder` (Rule builder).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (wave 3b: data and dashboard).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Rule builder. */
export const FREE_RULE_BUILDER: ComponentEntry = {
  slug: "rule-builder",
  tier: "free",
  category: "inputs_and_forms",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "RuleBuilder",
  parts: ["RuleBuilder"],
  hero: {},
  examples: [{ id: "discount", card: true }],
  related: ["free/filter-bar", "free/select", "free/form"],
  tokens: ["color.separator", "color.muted"],
  keywords: ["rule builder", "conditions", "query builder", "segment", "automation", "if"],
  status: "new",
};
