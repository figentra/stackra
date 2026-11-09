/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/bento-card` (BentoCard).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-2041 (the Stackra landing, W4).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The BentoCard entry of the component registry. */
export const FREE_BENTO_CARD: ComponentEntry = {
  slug: "bento-card",
  tier: "free",
  category: "layout",
  platforms: ["react"],
  packageName: "@stackra/ui",
  exportName: "BentoCard",
  parts: ["BentoCard"],
  // HeroUI's Card is a product card; this is the marketing bento card on theme tokens.
  hero: {},
  examples: [{ id: "feature", card: true }, { id: "brand" }],
  related: ["free/card", "free/dither-art", "free/frame"],
  tokens: ["radius.lg", "color.surface", "color.border"],
  keywords: ["bento", "feature card", "marketing card", "grid card", "product card"],
  status: "new",
};
