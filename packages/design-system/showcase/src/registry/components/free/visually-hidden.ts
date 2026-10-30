/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/visually-hidden` (VisuallyHidden).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The VisuallyHidden entry of the component registry. */
export const FREE_VISUALLY_HIDDEN: ComponentEntry = {
  slug: "visually-hidden",
  tier: "free",
  category: "foundations",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "VisuallyHidden",
  parts: ["VisuallyHidden"],
  hero: {},
  examples: [
    { id: "icon-context", card: true },
    { id: "cart-count" },
    { id: "stock-status" },
    { id: "skip-link", platforms: ["react"] },
  ],
  related: ["free/bidi", "free/icon-button", "free/foundations"],
  tokens: [],
  keywords: ["screen reader", "sr-only", "accessibility", "hidden"],
};
