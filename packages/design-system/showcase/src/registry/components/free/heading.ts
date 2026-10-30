/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/heading` (Heading).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (unregistered exports, owner approval
 *          2026-10-29).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Heading entry of the component registry. */
export const FREE_HEADING: ComponentEntry = {
  slug: "heading",
  tier: "free",
  category: "foundations",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "Heading",
  parts: ["Heading"],
  hero: {},
  examples: [
    { id: "levels", card: true },
    { id: "look", platforms: ["react"] },
  ],
  related: ["free/typography", "free/foundations"],
  tokens: ["color.foreground", "color.muted"],
  keywords: ["heading", "title", "h1", "outline", "level"],
  status: "new",
};
