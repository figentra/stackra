/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/copy-button` (Copy button).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; design-system gap inventory row 35.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Copy button. */
export const FREE_COPY_BUTTON: ComponentEntry = {
  slug: "copy-button",
  tier: "free",
  category: "actions",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "CopyButton",
  parts: ["CopyButton"],
  // HeroUI has no copy button; this one is the IconButton with a clipboard and a check.
  hero: {},
  examples: [{ id: "order-number", card: true }, { id: "api-key" }, { id: "variants" }],
  related: ["free/icon-button", "free/button", "free/property-list"],
  tokens: ["color.success", "motion.fast", "color.focus"],
  haptics: [{ event: "press", style: "impact" }],
  keywords: ["copy", "clipboard", "duplicate", "share"],
};
