/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/sources` (Sources and SourceChip).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (component gaps, owner approval
 *          2026-10-31).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Sources entry of the component registry. */
export const FREE_SOURCES: ComponentEntry = {
  slug: "sources",
  tier: "free",
  category: "ai",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "Sources",
  parts: ["Sources", "SourceChip"],
  // HeroUI has no citation chip; this one is our Disclosure, HoverCard and a HeroUI link.
  hero: {},
  examples: [{ id: "answer", card: true }, { id: "chips" }],
  related: ["free/chat-message", "free/hover-card", "free/link"],
  tokens: ["color.default", "color.muted", "radius.full"],
  keywords: ["ai", "sources", "citations", "references", "favicon", "links"],
  status: "new",
};
