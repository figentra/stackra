/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/tamo-draft-review` (Tamo draft review).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; ADR 0507 (Ask Tamo: AI slots in the design system).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Tamo draft review entry of the component registry. */
export const FREE_TAMO_DRAFT_REVIEW: ComponentEntry = {
  slug: "tamo-draft-review",
  tier: "free",
  category: "ai",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "TamoDraftReview",
  parts: ["TamoDraftReview"],
  hero: {},
  examples: [{ id: "review", card: true, platforms: ["react"] }],
  related: ["free/tamo-menu", "free/diff-review"],
  tokens: ["color.surface", "color.separator", "color.tamo-mark"],
  keywords: ["ai", "tamo", "draft", "review", "accept", "diff"],
  status: "new",
};
