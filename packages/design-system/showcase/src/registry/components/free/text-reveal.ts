/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/text-reveal` (TextReveal).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The TextReveal entry of the component registry. */
export const FREE_TEXT_REVEAL: ComponentEntry = {
  slug: "text-reveal",
  tier: "free",
  category: "foundations",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "TextReveal",
  parts: ["TextReveal"],
  hero: {},
  examples: [{ id: "hero", card: true }],
  related: ["free/typography"],
  tokens: [],
  keywords: ["headline", "hero", "reveal", "word animation"],
  status: "new",
};
