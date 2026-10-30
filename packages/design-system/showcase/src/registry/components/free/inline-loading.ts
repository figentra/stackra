/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/inline-loading` (Inline loading).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Inline loading entry of the component registry. */
export const FREE_INLINE_LOADING: ComponentEntry = {
  slug: "inline-loading",
  tier: "free",
  category: "feedback_and_status",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "InlineLoading",
  parts: ["InlineLoading"],
  hero: {},
  examples: [{ id: "payment", card: true }, { id: "row-save" }, { id: "states" }],
  related: ["free/spinner", "free/save-bar", "free/button"],
  tokens: ["color.success", "color.danger", "motion.fast"],
  haptics: [
    { event: "success", style: "success" },
    { event: "error", style: "error" },
  ],
  keywords: ["loading", "pending", "saving", "success", "error", "payment"],
};
