/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/diff-review` (Diff review).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (wave 3b: data and dashboard).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Diff review. */
export const FREE_DIFF_REVIEW: ComponentEntry = {
  slug: "diff-review",
  tier: "free",
  category: "data_display",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "DiffReview",
  parts: ["DiffReview"],
  hero: {},
  examples: [{ id: "supplier-feed", card: true }],
  related: ["free/property-list", "free/save-bar"],
  tokens: ["color.success", "color.danger", "color.separator"],
  keywords: ["diff", "change set", "review", "approve", "before after", "sync"],
  status: "new",
};
